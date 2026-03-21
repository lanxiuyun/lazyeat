# 手势管理系统

## 概述

这是一个重构后的手势管理系统，将原来分散在Guide.vue中的手势管理逻辑封装成可复用的类。系统采用面向对象设计，提供了更好的代码组织、类型安全和可测试性。

## 架构设计

### 核心类

1. **GestureAction** - 单个手势动作的封装
   - 管理手势的启用/禁用状态
   - 处理阈值和快捷键配置
   - 提供统一的接口操作

2. **GestureManager** - 手势管理器
   - 统一管理所有手势动作
   - 支持分组管理
   - 提供批量操作接口

3. **GestureFactory** - 手势工厂
   - 统一创建所有手势实例
   - 支持按分组创建
   - 集中管理手势配置

4. **KeyListener** - 键盘监听器
   - 统一管理快捷键监听逻辑
   - 提供超时和错误处理
   - 支持快捷键验证和格式化

5. **ShortcutUtils** - 快捷键工具
   - 快捷键解析和验证
   - 快捷键比较和格式化

## 使用示例

### 基本使用

```typescript
import { GestureManager, GestureFactory } from './utils/GestureManager';
import { use_app_store } from "@/store/app";

// 初始化手势管理器
const app_store = use_app_store();
const gestureManager = new GestureManager();

// 创建并注册所有手势
const gestures = GestureFactory.createAllGestures(app_store.config);
gestures.forEach(gesture => {
  gestureManager.register(gesture, 'basic');
});

// 操作手势
const cursorGesture = gestureManager.getGesture('ONLY_INDEX_UP');
if (cursorGesture) {
  cursorGesture.enabled = true; // 启用手势
  cursorGesture.toggle(); // 切换状态
}

// 批量操作
gestureManager.enableAll(); // 启用所有手势
gestureManager.disableAll(); // 禁用所有手势
gestureManager.resetAll(); // 重置所有手势
```

### 在Vue组件中使用

```vue
<template>
  <GestureCard
    v-for="gesture in gestureManager.getAllGestures()"
    :key="gesture.id"
    :title="$t(gesture.name)"
    :description="$t(gesture.description)"
  >
    <template #icon>
      <GestureIcon :icon="gesture.icon" />
    </template>
    <template #extra>
      <n-switch 
        :value="gesture.enabled" 
        @update:value="gesture.enabled = $event"
        size="small"
      >
        <template #checked>{{ $t('启用') }}</template>
        <template #unchecked>{{ $t('关闭') }}</template>
      </n-switch>
    </template>
  </GestureCard>
</template>

<script setup lang="ts">
import { GestureManager } from '@/utils/GestureManager';
import { GestureFactory } from '@/utils/GestureFactory';
import { use_app_store } from "@/store/app";

const app_store = use_app_store();
const gestureManager = new GestureManager();

// 初始化手势
onMounted(() => {
  const groupedGestures = GestureFactory.createGesturesByGroup(app_store.config);
  Object.entries(groupedGestures).forEach(([group, gestures]) => {
    gestures.forEach(gesture => {
      gestureManager.register(gesture, group);
    });
  });
});
</script>
```

### 快捷键监听

```typescript
import { KeyListener, ShortcutUtils } from './utils/KeyListener';

const keyListener = new KeyListener();

// 开始监听快捷键
const listenForShortcut = (gesture: GestureAction) => {
  keyListener.startListening((shortcut: string) => {
    if (ShortcutUtils.isValidShortcut(shortcut)) {
      gesture.shortcut = shortcut;
    }
  }, 10000); // 10秒超时
};

// 检查监听状态
const isListening = keyListener.listening;
const statusText = keyListener.statusText;
const status = keyListener.status; // 'warning' 或 undefined
```

## 优化带来的好处

### 1. 代码复用
- 避免重复的switch和监听逻辑
- 统一的手势管理接口
- 可复用的工具函数

### 2. 易于维护
- 添加新手势只需在GestureFactory中注册
- 修改逻辑只需在一个地方进行
- 清晰的类职责分离

### 3. 类型安全
- TypeScript提供完整的类型检查
- 编译时错误检测
- 更好的IDE支持

### 4. 可测试性
- 每个类都可以单独测试
- 模拟配置进行单元测试
- 集成测试更容易

### 5. 扩展性
- 易于添加新功能（如手势分组、批量操作）
- 支持复杂的手势配置
- 可扩展的架构设计

## 手势分组

系统支持将手势按功能分组：

1. **basic** - 基础手势（光标控制、点击操作）
2. **advanced** - 高级手势（滚动、全屏控制）
3. **shortcut** - 快捷键手势（自定义快捷键）
4. **voice** - 语音控制（语音识别）
5. **control** - 系统控制（暂停/继续）

## 配置选项

每个手势可以配置以下选项：

- **启用/禁用**：基本开关控制
- **阈值**：用于滚动等需要阈值的手势
- **快捷键**：自定义键盘快捷键
- **默认值**：重置时的默认配置

## 迁移指南

### 从旧代码迁移

**旧代码：**
```vue
<n-switch v-model:value="app_store.config.gestures_enabled.ONLY_INDEX_UP" size="small">
```

**新代码：**
```vue
<n-switch 
  :value="gesture.enabled" 
  @update:value="gesture.enabled = $event"
  size="small"
>
```

### 配置访问

**旧代码：** 直接访问深层属性
```typescript
app_store.config.gestures_enabled.ONLY_INDEX_UP
app_store.config.scroll_gesture_2_thumb_and_index_threshold
```

**新代码：** 通过GestureAction接口访问
```typescript
gesture.enabled
gesture.threshold
gesture.shortcut
```

## 测试

系统包含完整的单元测试：

```bash
# 运行测试
npm test -- GestureAction.test.ts

# 或使用测试框架
jest GestureAction.test.ts
```

## 注意事项

1. **配置对象引用**：GestureAction持有配置对象的引用，修改会直接影响原始配置
2. **内存管理**：及时清理事件监听器，避免内存泄漏
3. **类型安全**：确保TypeScript配置正确，以获得完整的类型检查
4. **错误处理**：KeyListener包含超时和错误处理，确保良好的用户体验

## 未来扩展

1. **手势优先级**：支持手势优先级设置
2. **冲突检测**：检测手势之间的冲突
3. **手势组合**：支持组合手势
4. **用户配置导入/导出**：支持配置备份和恢复
5. **手势学习**：基于使用习惯的智能推荐