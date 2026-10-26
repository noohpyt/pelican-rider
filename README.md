# 鹈鹕骑自行车

一只神情严肃的鹈鹕，骑着自行车在公路上飞驰。越肩视角、纵向卷轴，玩法致敬红白机经典《火箭车》（Road Fighter）：自动加速、左右变道、躲避车辆、收集燃料，看你能撑多远。

## 在线试玩

https://noohpyt.github.io/pelican-rider/

## 操作

| 按键 | 作用 |
| --- | --- |
| `A` / `←` | 向左变道 |
| `D` / `→` | 向右变道 |
| `Enter` | 开始 / 重新开始 |
| `Esc` | 关闭帮助 |

触屏设备提供左右两个按钮。

## 规则

- 自行车会自动持续加速，速度越快得分越快。
- 路上有其他车辆和路障，撞上会扣 1 点生命、大幅减速并损失燃料。
- 收集鱼形燃料罐可以补充燃料、获得分数。
- 燃料耗尽或 3 点生命耗尽则游戏结束。
- 坚持到目标距离即可过关。

## 运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

```bash
npm test       # 纯逻辑与 Three.js 动画集成测试
npm run build  # 输出 dist/
npm run preview
```

## 已知限制

- 未加入音频、联网排行榜、手柄支持；这些不属于本版范围。
- Google Fonts 不可用时会回退到系统无衬线字体，不影响游戏。

## License

本项目采用 GNU General Public License v3.0（GPL-3.0）授权。详见 [LICENSE](./LICENSE) 文件。
