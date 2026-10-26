# Pelican Rider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一款可运行、可试玩的 60 秒 Three.js 海边自行车收集游戏，所有可见角色、车辆、道具和场景均由代码生成。

**Architecture:** Vite 承载静态客户端，Three.js 负责 WebGL 场景。`game-core` 以纯 JavaScript 管理确定性状态、输入和碰撞；`models` 生成网格；`animation` 根据车速与曲柄相位求解踩踏；`main` 负责场景、生成物、镜头与 UI 同步。

**Tech Stack:** JavaScript、Three.js、Vite、Vitest、Playwright（仅用于浏览器验证）

**Spec:** 用户原始需求（2026-10-24）；无外部模型、贴图、音频或后端。

## Global Constraints

- 所有 3D 对象必须由几何体和材质程序化生成，不使用模型或二维贴图。
- 支持 WASD/方向键，60 秒一局，包含鱼收集、障碍碰撞、计分、加速、失败、重开。
- 停车时车轮和曲柄不转，脚部保持踏板接触，转向联动前轮和倾斜。
- 优先模型识别度、踩踏和玩法，再优化视觉；交付真实验证结果。

## Review Focus

- 反向输入和同时按左右键不能使坐标失控：核心输入测试。
- 碰撞不能一帧重复扣血，计时不能出现负数：核心状态测试。
- 停车及重开不能残留曲柄、生成物或按键状态：核心与动画测试。
- 踏板相位与左右脚必须相差 π：动画几何测试。
- 高 DPI 和窗口缩放不能破坏画面：浏览器截图和控制台检查。

---

### Task 1: 项目与纯逻辑核心

**Files:** `package.json`、`index.html`、`src/game-core.js`、`test/game-core.test.js`
**Interfaces:** `createGame()`、`updateGame(state, input, dt)`、`resetGame(state)`；状态含 `status/time/score/lives/speed/lateral/heading/invincible`。

- [ ] 写失败测试：初始状态、加速/减速、60 秒结算、三次碰撞失败、无敌帧、边界、重开、收集计分。
- [ ] 运行 `npm test` 确认测试因核心不存在而失败。
- [ ] 实现固定上限步长友好的核心更新和碰撞辅助函数。
- [ ] 运行 `npm test` 确认通过，并初始化 Vite 页面。

### Task 2: 程序化模型与踩踏动画

**Files:** `src/geometry.js`、`src/models.js`、`src/animation.js`、`test/animation.test.js`
**Interfaces:** `createRider()` 返回 `{group,bike,wheels,steering,crank,pedals,bird}`；`updateRider(rig, motion, dt)`；`solveLeg(hip, pedal, side)` 返回膝关节位置。

- [ ] 写失败测试：两轮、左右踏板反相、零速保持相位、脚到踏板误差、倾斜限幅。
- [ ] 运行测试确认失败。
- [ ] 用球体、胶囊、圆柱、圆环、挤出形状构造鹈鹕、完整自行车、鱼、路障和海岸装饰；设置柔和统一材质。
- [ ] 用两骨 IK 和速度驱动关节更新实现动画，运行测试确认通过。

### Task 3: 场景、生成物、镜头与 UI

**Files:** `src/main.js`、`src/style.css`
**Interfaces:** 每帧把核心状态传入 `updateRider`；开始/重开按钮和键盘调用同一状态入口。

- [ ] 实现弯曲视觉的直线路段循环、动态海面、渐变天空、道路标线、棕榈及云朵。
- [ ] 实现鱼/障碍池、分段生成、碰撞回调、粒子反馈和第三人称阻尼镜头。
- [ ] 实现开始页、HUD、倒计时、生命、分数、加速条、结算与重开，并适配窄屏。
- [ ] 运行 `npm run build` 确认生产构建通过。

### Task 4: 端到端验证与交付

**Files:** `README.md`
**Interfaces:** `npm run dev -- --host 127.0.0.1`；`npm test`；`npm run build`。

- [ ] 启动开发服务器，用内置浏览器打开并完成开始、移动、加速、收集、碰撞、失败/计时结束、重开流程。
- [ ] 检查控制台、截图、不同窗口尺寸；实测停车不空转和转向/踩踏视觉关系。
- [ ] 修复发现的问题并重复测试与构建。
- [ ] 在 README 写操作、规则、技术结构和未验证项；最终报告命令、端口及真实结果。
