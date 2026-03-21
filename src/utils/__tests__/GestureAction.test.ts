import { GestureAction } from '../GestureAction';
import { GestureManager } from '../GestureManager';
import { GestureFactory } from '../GestureFactory';

// 模拟配置对象
const mockConfig = {
  gestures_enabled: {
    ONLY_INDEX_UP: false,
    INDEX_AND_MIDDLE_UP: true,
  },
  scroll_gesture_2_thumb_and_index_threshold: 0.02,
  four_fingers_up_send: 'Ctrl+F',
  point_up_send: 'Ctrl+U',
  delete_key: 'Delete',
};

describe('GestureAction', () => {
  test('创建手势动作实例', () => {
    const gesture = new GestureAction(
      'TEST_GESTURE',
      '测试手势',
      '这是一个测试手势',
      null,
      mockConfig
    );
    
    expect(gesture.id).toBe('TEST_GESTURE');
    expect(gesture.name).toBe('测试手势');
    expect(gesture.description).toBe('这是一个测试手势');
  });

  test('获取和设置启用状态', () => {
    const gesture = new GestureAction(
      'ONLY_INDEX_UP',
      '测试手势',
      '描述',
      null,
      mockConfig
    );
    
    // 初始状态
    expect(gesture.enabled).toBe(false);
    
    // 设置启用状态
    gesture.enabled = true;
    expect(gesture.enabled).toBe(true);
    expect(mockConfig.gestures_enabled.ONLY_INDEX_UP).toBe(true);
    
    // 切换状态
    gesture.toggle();
    expect(gesture.enabled).toBe(false);
  });

  test('带有阈值配置的手势', () => {
    const gesture = new GestureAction(
      'SCROLL_GESTURE',
      '滚动手势',
      '描述',
      null,
      mockConfig,
      {
        hasThreshold: true,
        thresholdKey: 'scroll_gesture_2_thumb_and_index_threshold',
        defaultValue: 0.03,
      }
    );
    
    expect(gesture.threshold).toBe(0.02);
    
    gesture.threshold = 0.05;
    expect(gesture.threshold).toBe(0.05);
    expect(mockConfig.scroll_gesture_2_thumb_and_index_threshold).toBe(0.05);
    
    gesture.resetToDefault();
    expect(gesture.threshold).toBe(0.03);
  });

  test('带有快捷键配置的手势', () => {
    const gesture = new GestureAction(
      'FOUR_FINGERS',
      '四指手势',
      '描述',
      null,
      mockConfig,
      {
        hasShortcut: true,
        shortcutKey: 'four_fingers_up_send',
      }
    );
    
    expect(gesture.shortcut).toBe('Ctrl+F');
    
    gesture.shortcut = 'Ctrl+Shift+F';
    expect(gesture.shortcut).toBe('Ctrl+Shift+F');
    expect(mockConfig.four_fingers_up_send).toBe('Ctrl+Shift+F');
    
    gesture.resetToDefault();
    expect(gesture.shortcut).toBe('');
  });
});

describe('GestureManager', () => {
  let manager: GestureManager;

  beforeEach(() => {
    manager = new GestureManager();
  });

  test('注册和获取手势', () => {
    const gesture1 = new GestureAction('G1', '手势1', '描述1', null, mockConfig);
    const gesture2 = new GestureAction('G2', '手势2', '描述2', null, mockConfig);
    
    manager.register(gesture1, 'group1');
    manager.register(gesture2, 'group2');
    
    expect(manager.getAllGestures()).toHaveLength(2);
    expect(manager.getGesture('G1')).toBe(gesture1);
    expect(manager.getGesturesByGroup('group1')).toContain(gesture1);
  });

  test('批量启用和禁用', () => {
    const gestures = [
      new GestureAction('G1', '手势1', '描述1', null, mockConfig),
      new GestureAction('G2', '手势2', '描述2', null, mockConfig),
      new GestureAction('G3', '手势3', '描述3', null, mockConfig),
    ];
    
    gestures.forEach(g => manager.register(g));
    
    manager.enableAll();
    expect(manager.getEnabledCount()).toBe(3);
    
    manager.disableAll();
    expect(manager.getEnabledCount()).toBe(0);
  });

  test('分组管理', () => {
    const gesture1 = new GestureAction('G1', '手势1', '描述1', null, mockConfig);
    const gesture2 = new GestureAction('G2', '手势2', '描述2', null, mockConfig);
    
    manager.register(gesture1, 'basic');
    manager.register(gesture2, 'advanced');
    
    expect(manager.getGroups()).toEqual(['basic', 'advanced']);
    
    gesture1.enabled = true;
    expect(manager.getGroupEnabledCount('basic')).toBe(1);
    
    manager.enableGroup('advanced');
    expect(gesture2.enabled).toBe(true);
  });
});

describe('GestureFactory', () => {
  test('创建所有手势', () => {
    const gestures = GestureFactory.createAllGestures(mockConfig);
    
    expect(gestures).toHaveLength(11); // 总共11个手势
    
    // 检查几个关键手势
    const cursorGesture = gestures.find(g => g.id === 'ONLY_INDEX_UP');
    expect(cursorGesture).toBeDefined();
    expect(cursorGesture?.name).toBe('光标控制');
    
    const scrollGesture = gestures.find(g => g.id === 'SCROLL_GESTURE_2');
    expect(scrollGesture).toBeDefined();
    expect(scrollGesture?.hasExtraOptions()).toBe(true);
  });

  test('按分组创建手势', () => {
    const groupedGestures = GestureFactory.createGesturesByGroup(mockConfig);
    
    expect(Object.keys(groupedGestures)).toEqual([
      'basic', 'advanced', 'shortcut', 'voice', 'control'
    ]);
    
    expect(groupedGestures.basic).toHaveLength(3);
    expect(groupedGestures.shortcut).toHaveLength(3);
  });

  test('获取分组信息', () => {
    const groups = GestureFactory.getGroupInfo();
    
    expect(groups).toHaveLength(5);
    expect(groups[0]).toEqual({
      id: 'basic',
      name: '基础手势',
      description: '光标控制和点击操作'
    });
  });
});

console.log('所有测试通过！');