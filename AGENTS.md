# AGENTS.md - Guidelines for AI Coding Agents

This document provides guidelines for AI coding agents working on this Solana blog repository.

## Project Overview

This is a personal blog built with Jekyll and the TeXt Theme, documenting Solana blockchain development learning. The blog includes Rust fundamentals, Solana development basics, smart contract development, and learning notes.

## Build Commands

### Jekyll Commands (Ruby/Bundler)

```bash
# Install dependencies
bundle install

# Build for production
npm run build
# Equivalent: cross-env JEKYLL_ENV=production bundle exec jekyll build

# Serve locally (default)
npm run serve
# Equivalent: bundle exec jekyll serve -H 0.0.0.0

# Development mode
npm run dev
# Uses config: ./docs/_config.dev.yml

# Demo development mode
npm run demo-dev
# Uses config: ./docs/_config.yml

# Demo beta mode
npm run demo-beta

# Demo production mode
npm run demo-prod

# Default command
npm run default
# Equivalent: bundle exec jekyll serve -H 0.0.0.0 -t
```

### JavaScript Linting

```bash
# Lint JavaScript files
npm run eslint
# Lints: _includes/**/*.js

# Fix JavaScript linting issues
npm run eslint-fix
```

### SCSS Linting

```bash
# Lint SCSS files
npm run stylelint
# Lints: _sass/**/*.scss with syntax scss

# Fix SCSS linting issues
npm run stylelint-fix
```

### Gem Package Commands

```bash
# Build gem package
npm run gem-build

# Push gem to RubyGems
npm run gem-push
```

### Docker Commands

```bash
# Development with Docker
npm run docker-dev:default
npm run docker-dev:dev
npm run docker-dev:demo-dev
npm run docker-dev:demo-beta
npm run docker-dev:demo-prod

# Production Docker
npm run docker-prod:build
npm run docker-prod:serve
```

### Running a Single Test

This Jekyll theme project does not have a traditional unit test framework. The "test" directory contains sample blog content for validation:

```bash
# Build and validate test site
JEKYLL_ENV=production bundle exec jekyll build --config ./test/_config.yml
```

## Code Style Guidelines

### JavaScript Style

**General Principles:**
- Write modular, reusable functions
- Use IIFE pattern for encapsulation: `(function() { ... })();`
- Check for feature detection before usage: `window.hasEvent('touchstart')`

**Naming Conventions:**
- Functions: camelCase (e.g., `isArray`, `hasEvent`, `isOverallScroller`)
- Variables: camelCase (e.g., `$root`, `loaded`, `cbs`)
- Constants: N/A in existing code, but prefer UPPER_SNAKE_CASE if used

**Formatting:**
- Indent with 2 spaces
- Semicolons: always required
- Quotes: single quotes preferred
- No trailing commas
- Line ending: LF (configured in .editorconfig)
- Always end file with newline

**Example Pattern:**
```javascript
(function() {
  var $root = document.getElementsByClassName('root')[0];
  if (window.hasEvent('touchstart')) {
    $root.dataset.isTouch = true;
  }
})();
```

### SCSS Style

**Naming Conventions:**
- Files: snake_case (e.g., `_variables.scss`, `_base.scss`)
- Variables: camelCase or kebab-case (e.g., `$primary-color`, `$header-height`)
- Mixins: camelCase (e.g., `@mixin flex-center`)

**Property Order:**
Follow the stylelint-order plugin configuration. Key groups:
1. Position and layout (position, display, flex, grid)
2. Box model (width, height, padding, margin)
3. Typography (font, color, text)
4. Visual (background, border, shadow)
5. Animation and transition
6. Other properties

**Formatting:**
- Use double quotes for strings
- Lowercase for hex colors, use short form (e.g., `#fff`, `#ffffff`)
- No unit for zero values (e.g., `0` not `0px`)
- Vendor prefixes: not allowed (use `at-rule-no-vendor-prefix`)
- No `!important` declarations
- Max 2 consecutive empty lines
- Color names: never use named colors, use hex

**Example Pattern:**
```scss
.component {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
}
```

### HTML/Liquid Templates

**File Locations:**
- Layouts: `_layouts/`
- Includes: `_includes/`
- Data: `_data/`

**Naming:**
- Files: snake_case (e.g., `post.html`, `article_header.html`)

### Commit Messages

Follow Conventional Commits format enforced by commitlint:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Types:** build, chore, ci, docs, feat, fix, improvement, perf, refactor, release, revert, style, test

**Rules:**
- Header max 72 characters
- Type lowercase
- Subject: sentence-case, no period at end, no uppercase start
- Blank line between header and body

## Import Guidelines

**JavaScript:**
- No ES6 modules in existing code (uses IIFE pattern)
- jQuery available globally (configured in .eslintrc)

**SCSS:**
- Use `@import` or `@use` as appropriate
- Organize by: common, layout, components, skins, animate, additional

**Ruby Gems:**
- Jekyll >= 3.6, < 5.0
- jekyll-paginate, jekyll-sitemap, jekyll-feed, jemoji

## Error Handling

**JavaScript:**
- No console statements (ESLint rule: `no-console` error)
- Use feature detection before APIs
- Handle null/undefined checks explicitly

**Jekyll:**
- Check configuration files for errors
- Validate front matter in posts

## Git Workflow

1. Create feature branch from `master`
2. Make changes following code style guidelines
3. Run linting: `npm run eslint && npm run stylelint`
4. Test build: `npm run build`
5. Commit with conventional message format
6. Push and create pull request

## Cursor Rules Integration

This project has a `.cursorrules` file with the following guidelines:
- Follow SOLID, DRY, KISS, YAGNI principles
- Follow OWASP best practices
- Break tasks into smallest units
- Approach tasks step by step
- Respond in Chinese when appropriate

## Editor Configuration

The project uses EditorConfig with these settings:
- charset: utf-8
- indent_size: 2
- indent_style: space
- end_of_line: lf
- insert_final_newline: true
- max_line_length: 80
- trim_trailing_whitespace: true

## Key Files

- `package.json`: npm scripts and dependencies
- `.eslintrc`: JavaScript linting rules
- `.stylelintrc`: SCSS linting rules and property ordering
- `.commitlintrc.js`: commit message validation
- `_config.yml`: Jekyll main configuration
- `jekyll-text-theme.gemspec`: gem specification
