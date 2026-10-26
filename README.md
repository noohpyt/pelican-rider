# 鹈鹕骑自行车

一只鹈鹕骑着自行车在公路上前进。越肩视角，自动加速，左右变道躲避车辆、收集燃料。

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

- 自行车自动持续加速。
- 路上有车辆和路障，撞上会扣 1 点生命、大幅减速并损失燃料。
- 收集鱼形燃料罐可以补充燃料、获得分数。
- 燃料耗尽或 3 点生命耗尽则游戏结束。
- 到达目标距离即可过关。

## 运行

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## License

本项目采用 GNU General Public License v3.0（GPL-3.0）授权。详见 [LICENSE](./LICENSE) 文件。
