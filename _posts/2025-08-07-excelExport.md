---
title: Excel大数据量导入优化实战：从300秒到8秒的性能优化之路
tags: 场景
---

# Excel大数据量导入优化实战

> 📊 **优化成果**：将Excel大数据量导入接口性能从 **300秒** 优化到 **8秒**

在企业级应用中，Excel大数据量导入是一个常见但充满挑战的需求。看似简单的功能，实际上涉及内存管理、并发处理、事务控制、数据库优化等多个技术难点。本文将分享我在实际项目中的优化实践，从最初的性能瓶颈到最终的高效解决方案。

## 🎯 核心挑战

在处理Excel大数据量导入时，主要面临以下挑战：

- **内存溢出（OOM）**：大量数据加载到内存可能导致JVM崩溃
- **执行速度慢**：单线程处理大量数据效率低下
- **事务一致性**：多线程环境下的事务管理复杂
- **数据库性能**：大批量数据写入的数据库瓶颈

## 🔧 解决方案详解

### 1. 内存优化：分批处理防止OOM

**问题分析**：如果将10万条Excel数据一次性加载到内存，极易导致内存溢出。

**解决方案**：使用 **EasyExcel** 进行分批处理

```java
/**
 * 分批读取Excel数据，避免内存溢出
 * 将10万条数据分成每批1万条处理
 */
@Component
public class ExcelBatchProcessor {

    private static final int BATCH_SIZE = 10000;

    public void processExcelFile(String filePath) {
        EasyExcel.read(filePath, YourDataModel.class, new ExcelDataListener())
                .sheet()
                .headRowNumber(1)
                .doRead();
    }

    @Component
    public class ExcelDataListener extends AnalysisEventListener<YourDataModel> {

        private List<YourDataModel> dataList = new ArrayList<>();

        @Override
        public void invoke(YourDataModel data, AnalysisContext context) {
            dataList.add(data);

            // 达到批处理大小时进行处理
            if (dataList.size() >= BATCH_SIZE) {
                processBatch(dataList);
                dataList.clear();
            }
        }

        @Override
        public void doAfterAllAnalysed(AnalysisContext context) {
            // 处理最后一批数据
            if (!dataList.isEmpty()) {
                processBatch(dataList);
            }
        }

        private void processBatch(List<YourDataModel> batch) {
            // 业务逻辑处理：数据验证、格式转换等
            validateAndTransform(batch);
            // 多线程插入数据库
            parallelUpdateBatch(batch);
        }
    }
}
```

### 2. 多线程优化：提升处理速度

**核心思路**：基于CPU核心数动态分配线程，并行处理数据插入

```java
/**
 * 多线程批量更新数据
 * 支持事务一致性控制
 */
public void parallelUpdateBatch(List<PauseAndReuseUpdateDto> list) throws InterruptedException {

    // 事务回滚控制器
    DataRollBack dataRollBack = new DataRollBack(false);

    // 主线程等待闭锁
    CountDownLatch mainCountDownLatch = new CountDownLatch(1);

    // 动态计算线程数（CPU核心数 * 2）
    Integer threadNum = Runtime.getRuntime().availableProcessors() * 2;

    // 数据分片：根据线程数平均分配任务
    List<List<PauseAndReuseUpdateDto>> dataChunks = ListUtil.averageAssign(list, threadNum);

    // 子线程执行结果收集
    List<Boolean> executionResults = Collections.synchronizedList(new ArrayList<>());

    // 过滤空列表
    dataChunks = dataChunks.stream()
            .filter(chunk -> !ObjectUtils.isEmpty(chunk))
            .collect(Collectors.toList());

    // 子线程计数器
    CountDownLatch childCountDownLatch = new CountDownLatch(dataChunks.size());

    // 🚀 启动多线程任务
    for (List<PauseAndReuseUpdateDto> dataChunk : dataChunks) {
        CompletableFuture.runAsync(() -> {
            parallelUpdate(dataChunk, mainCountDownLatch, childCountDownLatch,
                         executionResults, dataRollBack);
        }, threadPoolExecutor);
    }

    // 等待所有子线程完成
    childCountDownLatch.await();

    // 📊 检查执行结果
    boolean hasFailure = executionResults.stream().anyMatch(result -> !result);
    if (hasFailure) {
        log.warn("=== 多线程插入执行失败，准备回滚 ===");
        dataRollBack.setIsRollBack(true);
    }

    // 🔓 释放所有子线程，开始事务提交/回滚
    mainCountDownLatch.countDown();

    if (dataRollBack.getIsRollBack()) {
        log.error("=== 主线程触发全局回滚 ===");
        throw new SchedulingException("数据处理失败，已回滚所有操作");
    }

    log.info("=== ✅ 多线程数据插入成功完成 ===");
}
```

### 3. 事务控制：多线程环境下的一致性保证

**核心难点**：多线程环境下保证数据一致性，要么全部成功，要么全部回滚

```java
/**
 * 子线程数据处理逻辑
 * 实现分布式事务控制
 */
public void parallelUpdate(List<PauseAndReuseUpdateDto> dataChunk,
                          CountDownLatch mainCountDownLatch,
                          CountDownLatch childCountDownLatch,
                          List<Boolean> executionResults,
                          DataRollBack dataRollBack) {

    TransactionStatus transactionStatus = null;
    String threadName = "MyTx" + Thread.currentThread().getName();

    try {
        // 🔄 创建独立事务
        DefaultTransactionDefinition definition = new DefaultTransactionDefinition();
        definition.setName(threadName);
        definition.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        transactionStatus = transactionManager.getTransaction(definition);

        // 📝 执行数据处理逻辑
        for (PauseAndReuseUpdateDto dto : dataChunk) {
            String carNo = dto.getKcProductionPlanEntity().getCarNo();
            log.debug("子线程: {}, 处理车号: {}", threadName, carNo);

            // 主表更新
            this.saveOrUpdate(dto.getKcProductionPlanEntity());

            // 关联表批量更新
            updateRelatedData(dto, threadName, carNo);
        }

        // ✅ 标记当前线程执行成功
        executionResults.add(Boolean.TRUE);

    } catch (TransactionException e) {
        log.error("子线程: {} 事务创建失败", threadName, e);
        executionResults.add(Boolean.FALSE);
    } catch (Exception e) {
        log.error("子线程: {} 数据处理异常", threadName, e);
        if (transactionStatus != null) {
            transactionManager.rollback(transactionStatus);
        }
        executionResults.add(Boolean.FALSE);
    } finally {
        // 🔄 释放子线程计数
        childCountDownLatch.countDown();
    }

    try {
        // ⏳ 等待主线程协调决策
        mainCountDownLatch.await();

        // 🎯 根据全局状态决定提交或回滚
        if (dataRollBack.getIsRollBack()) {
            transactionManager.rollback(transactionStatus);
            log.warn("子线程: {} 已回滚", threadName);
        } else {
            transactionManager.commit(transactionStatus);
            log.info("子线程: {} 已提交", threadName);
        }

    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        log.error("子线程: {} 等待中断", threadName, e);
    }
}

/**
 * 更新关联数据
 */
private void updateRelatedData(PauseAndReuseUpdateDto dto, String threadName, String carNo) {
    // 更新生产计划数据
    List<KcPlanProductionDataEntity> planDataList = dto.getKcPlanDataList();
    if (ObjectUtil.isNotEmpty(planDataList)) {
        boolean success = kcPlanProductionDataService.updateBatchById(planDataList, 3000);
        if (!success) {
            log.warn("更新岗位供件时间失败, 线程: {}, 车号: {}", threadName, carNo);
            throw new RuntimeException("更新岗位供件时间失败");
        }
    }

    // 更新领料单数据
    List<PiGetMaterialsEntity> materialsList = dto.getPiGetList();
    if (ObjectUtil.isNotEmpty(materialsList)) {
        boolean success = piGetMaterialsService.updateBatchById(materialsList, 3000);
        if (!success) {
            log.warn("更新领料单失败, 线程: {}, 车号: {}", threadName, carNo);
            throw new RuntimeException("更新领料单失败");
        }
    }
}
```

### 4. 数据库优化：MySQL参数调优

经过多线程优化后，瓶颈转移到了数据库写入。通过调整以下MySQL参数显著提升性能：

#### 🎯 关键参数调优

| 参数名 | 推荐值 | 作用说明 |
|--------|--------|----------|
| `innodb_buffer_pool_size` | 系统内存的70-80% | 增加InnoDB缓冲池，减少磁盘I/O |
| `innodb_log_file_size` | 256MB-1GB | 增大日志文件，减少日志切换频率 |
| `innodb_log_buffer_size` | 16MB-64MB | 优化日志缓冲区大小 |
| `bulk_insert_buffer_size` | 64MB-256MB | 优化批量插入性能 |
| `max_allowed_packet` | 64MB-1GB | 支持大数据包传输 |

#### 📋 具体配置示例

```sql
-- InnoDB 核心优化
SET GLOBAL innodb_buffer_pool_size = 2147483648;  -- 2GB
SET GLOBAL innodb_log_file_size = 268435456;      -- 256MB
SET GLOBAL innodb_log_buffer_size = 67108864;     -- 64MB

-- 批量插入优化
SET GLOBAL bulk_insert_buffer_size = 67108864;    -- 64MB
SET GLOBAL max_allowed_packet = 1073741824;       -- 1GB

-- 事务优化
SET SESSION autocommit = 0;  -- 关闭自动提交，手动控制事务
SET SESSION transaction_isolation = 'READ-COMMITTED';  -- 降低隔离级别

-- MyISAM 引擎优化（如果使用）
SET GLOBAL key_buffer_size = 268435456;           -- 256MB
SET GLOBAL myisam_sort_buffer_size = 134217728;   -- 128MB
```

## ⚠️ 生产环境问题与解决方案

### 5.1 并发导入OOM问题

**现象**：多用户同时导入Excel时仍然出现内存溢出

**原因分析**：
- 单个导入已经分批处理，但多个并发导入累积内存占用过大
- JVM堆内存设置不足以支撑高并发场景

**解决方案**：

```java
/**
 * 使用分布式锁限制并发导入数量
 */
@Component
public class ExcelImportLockManager {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String IMPORT_LOCK_KEY = "excel:import:lock";
    private static final int MAX_CONCURRENT_IMPORTS = 3;  // 最大并发导入数
    private static final int LOCK_TIMEOUT = 30;  // 锁超时时间（分钟）

    /**
     * 获取导入许可
     */
    public boolean acquireImportPermit(String userId) {
        String lockKey = IMPORT_LOCK_KEY + ":" + userId;

        // 检查当前并发数
        Set<String> currentLocks = redisTemplate.keys(IMPORT_LOCK_KEY + ":*");
        if (currentLocks != null && currentLocks.size() >= MAX_CONCURRENT_IMPORTS) {
            log.warn("当前导入并发数已达上限: {}", MAX_CONCURRENT_IMPORTS);
            return false;
        }

        // 获取锁
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "importing", Duration.ofMinutes(LOCK_TIMEOUT));

        return Boolean.TRUE.equals(acquired);
    }

    /**
     * 释放导入许可
     */
    public void releaseImportPermit(String userId) {
        String lockKey = IMPORT_LOCK_KEY + ":" + userId;
        redisTemplate.delete(lockKey);
    }
}
```

**配置优化**：

```bash
# JVM 堆内存调优
-Xms4g -Xmx8g  # 根据服务器配置调整
-XX:+UseG1GC   # 使用G1垃圾回收器
-XX:MaxGCPauseMillis=200  # 控制GC停顿时间
```

### 5.2 事务提交超时问题

**现象**：数据量大时出现事务提交超时，线程一直阻塞

**根本原因**：线程池配置不当，核心线程数过少导致任务堆积

**解决方案**：

```java
/**
 * 线程池配置优化
 */
@Configuration
public class ThreadPoolConfig {

    @Bean("excelProcessorThreadPool")
    public ThreadPoolExecutor excelProcessorThreadPool() {
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2;
        int maxPoolSize = corePoolSize * 2;
        long keepAliveTime = 60L;

        return new ThreadPoolExecutor(
                corePoolSize,                    // 核心线程数
                maxPoolSize,                     // 最大线程数
                keepAliveTime,                   // 线程存活时间
                TimeUnit.SECONDS,                // 时间单位
                new ArrayBlockingQueue<>(100),   // 工作队列
                new ThreadFactoryBuilder()
                        .setNameFormat("excel-processor-%d")
                        .setDaemon(false)
                        .build(),
                new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
        );
    }
}
```

**关键改进点**：
1. **动态线程数计算**：基于CPU核心数而非固定值
2. **合理队列大小**：避免任务无限堆积
3. **拒绝策略优化**：使用调用者线程执行，保证任务不丢失

## 📊 性能优化效果

| 优化阶段 | 处理方式 | 10万条数据耗时 | 内存占用 | 并发支持 |
|----------|----------|----------------|----------|----------|
| **初始版本** | 单线程全量加载 | ~300秒 | >2GB | 1个用户 |
| **分批优化** | EasyExcel分批 | ~180秒 | ~200MB | 1个用户 |
| **多线程优化** | 并行处理 | ~45秒 | ~300MB | 1个用户 |
| **数据库优化** | MySQL调优 | ~15秒 | ~300MB | 1个用户 |
| **最终版本** | 全链路优化 | **~8秒** | ~400MB | **3个用户** |

> 🎉 **最终成果**：性能提升 **37.5倍**，支持并发导入

## 🏆 最佳实践总结

### ✅ 核心优化策略

1. **内存管理**
   - 使用流式读取，避免全量加载
   - 合理设置批处理大小（推荐1万条/批）
   - 及时释放临时对象，减少GC压力

2. **并发控制**
   - 基于CPU核心数动态计算线程数
   - 使用`CountDownLatch`协调多线程
   - 实现分布式锁限制并发数量

3. **事务管理**
   - 每个线程独立事务，最后统一决策
   - 使用适当的事务隔离级别
   - 合理设置事务超时时间

4. **数据库优化**
   - 调整InnoDB缓冲池大小
   - 优化批量插入参数
   - 使用合适的索引策略

### 🚀 性能监控指标

```java
/**
 * 性能监控埋点
 */
@Component
public class PerformanceMonitor {

    private final MeterRegistry meterRegistry;

    public void recordImportMetrics(String operation, long duration, int recordCount) {
        // 记录处理耗时
        Timer.Sample sample = Timer.start(meterRegistry);
        sample.stop(Timer.builder("excel.import.duration")
                .tag("operation", operation)
                .register(meterRegistry));

        // 记录处理数量
        meterRegistry.counter("excel.import.records", "operation", operation)
                .increment(recordCount);

        // 记录处理速度（条/秒）
        double rps = recordCount * 1000.0 / duration;
        meterRegistry.gauge("excel.import.rps", "operation", operation, rps);
    }
}
```

## 🔮 后续优化方向

1. **异步化改造**：使用MQ实现完全异步处理
2. **分库分表**：支持更大数据量的水平扩展
3. **缓存优化**：引入Redis缓存热点数据
4. **文件分片**：支持超大Excel文件的分片上传
5. **实时进度**：WebSocket实时反馈处理进度

通过以上优化方案，我们成功将Excel大数据量导入的性能提升了37.5倍，同时保证了数据一致性和系统稳定性。这套方案在生产环境中稳定运行，为用户提供了流畅的数据导入体验。

> 💡 **关键启示**：性能优化是一个系统工程，需要从内存、并发、事务、数据库等多个维度综合考虑，单点优化往往效果有限。
