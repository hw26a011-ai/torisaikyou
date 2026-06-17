/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ElementType } from "../types";

// Pixel patterns for different bird archetypes
const TEMP_NORMAL = [
  "................................",
  "................................",
  ".............######.............", // Crown/Headtop
  "...........##########...........",
  "..........###ssssss###...........", // Special crest / stripe
  ".........###ssssssss###.........",
  "........###eeeessssss###........", // Eyes
  ".......###eppppeeesss####.......",
  ".......###eppppeeesss####.......",
  "..bbb..###eeeessssss#####.......", // Beak to the left
  "bbbbb..####ssssssss######.......",
  ".bbb....################........",
  ".........##############.........",
  "........######aaaaaa####........", // Body starts. 'a' is tummy
  ".......######aaaaaaaa####.......",
  "......######aaaaaaaaaa####......",
  ".....######aaaaaaaaaaaa####.....",
  "....######aaaaaaaaaaaaaa####....",
  "....######aaaaaaaaaaaaaa####....",
  "....#####aaaaaaa#########aaa....", // Wing '#' on the side
  "....#####aaaaa############aa....",
  ".....####aaaa#############......",
  ".....####aaa#############.......",
  "......###aa#############........",
  ".......################.........",
  "........##############..........",
  ".........###########............",
  ".............#########..........",
  "...........ll...ll..............", // Elegant legs
  "...........ll...ll..............",
  "..........lll...lll.............",
  "................................"
];

const TEMP_RAPTOR = [
  "................................",
  "............########............", // Crest
  "..........############..........",
  ".........###############........",
  "........#####ssssssss####.......", // Strong back stripe
  ".......#####ssssssssss####......",
  "......#####eeeessssssss####.....", // Severe eye
  ".....#####eppppesessssss###.....",
  ".....#####eppppesessssss###.....",
  ".....#####eeeessssssssss###.....",
  "..bb.#####ssssssssssssss###.....", // Strong hooked beak
  "bbbb.######ssssssssssss####.....",
  "bbbb..#################.........",
  ".bb....###############..........",
  "........############............",
  ".......#####aaaaaa######........", // Muscular chest
  "......#####aaaaaaaa######.......",
  ".....#####aaaaaaaaaa######......",
  "....#####aaaaaaaaaaaa#####......",
  "....#####aaaaaaaaaaaa#####......",
  "....#####aaaaaa###########......", // Heavy wing
  "....#####aaaa#############......",
  "....#####aaa##############......",
  ".....####aa##############.......",
  "......##################........",
  ".......################.........",
  "........##############..........",
  ".........###########............",
  "..........ll.....ll.............", // Solid legs
  "..........ll.....ll.............",
  ".........lll.....lll............",
  "................................"
];

const TEMP_OWL = [
  "................................",
  ".......sss...........sss........", // Cute owl ear tufts
  "......sssss.........sssss.......",
  "......######.......######.......", // Flat-top head
  ".....#####################......",
  "....#######################.....",
  "....###eeeeee#####eeeeee###.....", // Huge round eye discs
  "...###eeeeeeee###eeeeeeee###....",
  "...##eepppppeee#eeepppppeeee#...", // Big pupils
  "...##eepppppeee#eeepppppeeee#...",
  "...###eeeeeeee###eeeeeeee###....",
  "....###eeeeee#bbb#eeeeee###.....", // Cute small beak in middle
  ".....#########bbb#########......",
  "......########bbb########.......",
  ".......#################........",
  "......######aaaaaa#######.......", // Fluffy body
  ".....######aaaaaaaa#######......",
  "....######aaaaaaaaaa#######.....",
  "...######aaaaaaaaaaaa#######....",
  "...######aaaaaaaaaaaa#######....",
  "...#####aaaaaaaaaaaaaa######....",
  "...#####aaaaaaaaaaaaaa######....",
  "...#####aaaaaa##aaaaaa######....", // Mottled feathers texture
  "....####aaaaa####aaaaa#####.....",
  "....#####aaa######aaa######.....",
  ".....#####################......",
  "......###################.......",
  ".......#################........",
  ".........ll.........ll..........", // Broad feet
  ".........ll.........ll..........",
  "........lll.........lll.........",
  "................................"
];

const TEMP_LONG_BEAK = [
  "................................",
  "................................",
  "...............#######..........",
  ".............###########........",
  "............###sssssss###.......",
  "...........###sssssssss###......",
  "..........###eeeessssss###......", // Sparkly eye
  ".........###eppppeesssss###.....",
  ".........###eppppeesssss###.....",
  ".........###eeeessssssss###.....",
  "..........###ssssssssss####.....",
  "...........##############.......",
  "bbbbbbbbbb..############........", // Extremely long beak!
  "bbbbbbbbbbbb.##########.........",
  "bbbbbbbbbbbb.##########.........",
  "bbbbbbbbbb..##########..........",
  "...........##########...........",
  "..........#####aaaaaa####.......", // Streamlined body
  ".........#####aaaaaaaa####......",
  "........#####aaaaaaaaaa####.....",
  ".......#####aaaaaaaaaaaa####....",
  "......#####aaaaaaaaaaaaaa####...",
  "......#####aaaaa###########.....", // Long pointed wing
  "......#####aaa############......",
  "......#####aa############.......",
  "......##################........",
  ".......################.........",
  "........##############..........",
  ".........###########............",
  "..........ll......ll............",
  "..........ll......ll............",
  ".........lll......lll..........."
];

// Master styles mapping for all bird characters in the database.
// This matches their exact physical characteristics to avoid duplicates and look realistic.
const BIRD_STYLES: Record<string, {
  template: string[];
  main: string;      // (#)
  sub: string;       // (a)
  beak: string;      // (b)
  special?: string;  // (s)
  leg?: string;      // (l)
  eye?: string;      // (e)
  pupil?: string;    // (p)
}> = {
  "C01": { // キジ
    template: TEMP_LONG_BEAK,
    main: "#064e3b",      // 深緑
    sub: "#7c2d12",       // 赤茶
    beak: "#fde047",      // 黄クチバシ
    special: "#ef4444",   // 目の周りの真っ赤な皮膚
    leg: "#a1a1aa"
  },
  "C02": { // オオワシ
    template: TEMP_RAPTOR,
    main: "#1c1917",      // 黒褐色
    sub: "#ffffff",       // 白い羽先
    beak: "#facc15",      // 鮮やかな黄色
    special: "#eab308",
    leg: "#facc15"
  },
  "C01_2": { // イヌワシ
    template: TEMP_RAPTOR,
    main: "#451a03",      // 焦茶
    sub: "#ca8a04",       // 金色の冠羽
    beak: "#4b5563",      // 濃い灰色
    special: "#facc15"
  },
  "C02_2": { // シマフクロウ
    template: TEMP_OWL,
    main: "#78350f",      // 錆茶
    sub: "#ca8a04",       // 土色斑模様
    beak: "#1a1a1a",
    special: "#fbbf24",   // 金色の瞳
    leg: "#78350f"
  },
  "C03": { // トキ
    template: TEMP_LONG_BEAK,
    main: "#fff1f2",      // 淡い朱鷺色
    sub: "#fda4af",       // 翼の深めの朱色
    beak: "#18181b",      // 黒く長いクチバシ
    special: "#dc2626",   // 赤い顔
    leg: "#e11d48"
  },
  "C04": { // ハヤブサ
    template: TEMP_RAPTOR,
    main: "#4b5563",      // 濃灰色
    sub: "#f1f5f9",       // 縞模様のある白腹
    beak: "#fbbf24",      // 蝋膜の黄色
    special: "#18181b",   // 目の下の黒いヒゲ
    leg: "#fbbf24"
  },
  "C05": { // カワセミ
    template: TEMP_LONG_BEAK,
    main: "#06b6d4",      // コバルトブルー
    sub: "#ea580c",       // オレンジのお腹
    beak: "#18181b",      // 真っ黒なクチバシ
    special: "#ffffff",   // 頬の白い斑
    leg: "#ef4444"
  },
  "C06": { // ライチョウ
    template: TEMP_NORMAL,
    main: "#ffffff",      // 純白の冬羽
    sub: "#e4e4e7",       // グレーの羽影
    beak: "#18181b",
    special: "#dc2626",   // 目の上の赤い肉冠
    leg: "#fafafa"        // 羽毛で覆われた白い足
  },
  "C07": { // フクロウ
    template: TEMP_OWL,
    main: "#a1a1aa",      // グレー
    sub: "#f4f4f5",       // パステルまだら
    beak: "#d97706",
    special: "#71717a",
    leg: "#71717a"
  },
  "C08": { // ヨダカ
    template: TEMP_NORMAL,
    main: "#52525b",      // 灰褐色
    sub: "#27272a",       // 暗い樹皮色
    beak: "#18181b",
    special: "#3f3f46"
  },
  "C03_2": { // サンコウチョウ
    template: TEMP_NORMAL,
    main: "#1e3a8a",      // 暗藍色
    sub: "#3b82f6",       // 尾羽のコバルト
    beak: "#60a5fa",      // 鮮やかな青いクチバシ
    special: "#3b82f6"    // 鮮やかなアイリング
  },
  "C04_2": { // ミサゴ
    template: TEMP_RAPTOR,
    main: "#451a03",      // 焦茶
    sub: "#ffffff",       // 白い胸
    beak: "#18181b",
    special: "#475569",   // 黒い過眼線
    leg: "#cbd5e1"
  },
  "C05_2": { // オシドリ
    template: TEMP_NORMAL,
    main: "#ea580c",      // オレンジ
    sub: "#3b82f6",       // 紺緑の極彩色
    beak: "#dc2626",      // 赤いクチバシ
    special: "#ffffff",   // 目の周りの白
    leg: "#ca8a04"
  },
  "C09": { // ベニマシコ
    template: TEMP_NORMAL,
    main: "#f43f5e",      // 深いローズ
    sub: "#ffe4e6",       // 白っぽいお腹
    beak: "#d97706",
    special: "#fb7185"
  },
  "C10": { // コサギ
    template: TEMP_LONG_BEAK,
    main: "#ffffff",      // 純白
    sub: "#f8fafc",
    beak: "#18181b",      // 黒いまっすぐなクチバシ
    special: "#facc15",   // 目の前の黄色・足指の黄色
    leg: "#18181b"        // 黒い脚に黄色い指のコントラスト
  },
  "C11": { // ヒバリ
    template: TEMP_NORMAL,
    main: "#854d0e",      // 枯草色
    sub: "#fef08a",       // 黄色お腹
    beak: "#ca8a04",
    special: "#d97706"
  },
  "C12": { // アカゲラ
    template: TEMP_LONG_BEAK,
    main: "#18181b",      // 黒
    sub: "#ffffff",       // 白
    beak: "#4b5563",
    special: "#dc2626"    // お尻の赤
  },
  "C13": { // メジロ
    template: TEMP_NORMAL,
    main: "#84cc16",      // 鶯オリーブグリーンよりも鮮やかな黄緑
    sub: "#fef08a",       // 喉元のレモンイエロー
    beak: "#4b5563",
    special: "#ffffff"    // 自慢のピュア白いアイリング！
  },
  "C14": { // モズ
    template: TEMP_RAPTOR,
    main: "#b45309",      // 橙褐色
    sub: "#fafaf9",
    beak: "#18181b",
    special: "#18181b"    // 黒い泥棒マスク状の過眼線
  },
  "C15": { // キジバト
    template: TEMP_NORMAL,
    main: "#78716c",      // 灰紫
    sub: "#d6d3d1",
    beak: "#4b5563",
    special: "#3b82f6"    // 首元の青黒ストライプ
  },
  "C16": { // タンチョウ
    template: TEMP_LONG_BEAK,
    main: "#ffffff",      // 白
    sub: "#18181b",       // 喉や尾先(実は風切羽)の黒
    beak: "#854d0e",
    special: "#dc2626",   // 頭頂の赤
    leg: "#18181b"
  },
  "C11_2": { // ヤマガラ
    template: TEMP_NORMAL,
    main: "#ea580c",      // レンガ色の腹
    sub: "#18181b",       // 黒い頭
    beak: "#27272a",
    special: "#fef08a"    // クリーム色の頬
  },
  "C12_2": { // オオマシコ
    template: TEMP_NORMAL,
    main: "#e11d48",      // 目の覚めるような濃い紅
    sub: "#fda4af",       // おでこ・のどの白
    beak: "#b45309",
    special: "#f43f5e"
  },
  "C13_2": { // ツバメ
    template: TEMP_NORMAL,
    main: "#1e3a8a",      // 光沢ある紺色
    sub: "#ffffff",       // お腹の白
    beak: "#18181b",
    special: "#dc2626"    // 喉とおでこの赤
  },
  "C17": { // シマエナガ
    template: TEMP_NORMAL,
    main: "#ffffff",      // まっしろふわふわボディー
    sub: "#27272a",       // 黒い尾斑
    beak: "#18181b",      // 点のような黒くちばし
    special: "#facc15"    // 黄色いアイライン
  },
  "C18": { // ウグイス
    template: TEMP_NORMAL,
    main: "#606a43",      // 控えめな本物のウグイスオリーブ
    sub: "#f1f5f9",
    beak: "#854d0e",
    special: "#d9f99d"
  },
  "C19": { // カルガモ
    template: TEMP_NORMAL,
    main: "#78350f",      // 褐色の身体
    sub: "#e2e8f0",       // 斑模様
    beak: "#facc15",      // 黒ベースだが先端だけ黄色！これが最大の特徴
    special: "#18181b"
  },
  "C20": { // アヒル
    template: TEMP_NORMAL,
    main: "#ffffff",      // 真っ白
    sub: "#f1f5f9",
    beak: "#f97316",      // オレンジ色のくちばし
    leg: "#f97316"
  },
  "C21": { // アマツバメ
    template: TEMP_NORMAL,
    main: "#27272a",      // 黒褐色
    sub: "#18181b",
    beak: "#18181b",
    special: "#a1a1aa"
  },
  "C22": { // セキセイインコ
    template: TEMP_NORMAL,
    main: "#84cc16",      // インコグリーン
    sub: "#eab308",       // インコイエロー
    beak: "#ca8a04",
    special: "#3b82f6"    // 鼻とお尻の青
  },
  "C23": { // コウテイペンギン
    template: TEMP_OWL,
    main: "#1f2937",      // 濃紺の背
    sub: "#ffffff",       // 白い腹
    beak: "#f97316",      // クチバシのオレンジ線
    special: "#facc15",   // 首元の黄色グラデーション
    leg: "#374151"
  },
  "C24": { // ドバト
    template: TEMP_NORMAL,
    main: "#64748b",      // グレー
    sub: "#0d9488",       // 首のメタリックグリーン
    beak: "#4b5563",
    special: "#ec4899"    // メタリックピンク
  },
  "C17_2": { // ヒガラ
    template: TEMP_NORMAL,
    main: "#4b5563",      // 青グレー
    sub: "#18181b",       // 黒い頭と喉
    beak: "#18181b",
    special: "#ffffff"    // 目立つ白い後頭部
  },
  "C18_2": { // キビタキ
    template: TEMP_NORMAL,
    main: "#18181b",      // 黒い体
    sub: "#eab308",       // 目の覚めるようなオレンジに近い黄色い胸
    beak: "#27272a",
    special: "#fbbf24"    // 黄色い眉斑
  },
  "C19_2": { // コゲラ
    template: TEMP_LONG_BEAK,
    main: "#78350f",      // 灰褐色
    sub: "#ffffff",       // 横線の縞模様
    beak: "#4b5563",
    special: "#dc2626"    // 隠された赤い耳羽
  },
  "C20_2": { // スズメ
    template: TEMP_NORMAL,
    main: "#854d0e",      // スズメ茶
    sub: "#fafaf9",       // 頬の白
    beak: "#111827",
    special: "#111827"    // 頬の真っ黒な斑点！
  },
  "C30": { // ニシツノメドリ
    template: TEMP_LONG_BEAK,
    main: "#1c1917",
    sub: "#ffffff",       // 白い顔
    beak: "#ef4444",      // 派手なオレンジのクチバシ
    special: "#eab308"
  },
  "C31": { // シロフクロウ
    template: TEMP_OWL,
    main: "#ffffff",      // まっしろ
    sub: "#52525b",       // 虎斑
    beak: "#18181b",
    special: "#eab308"
  },
  "C32": { // ケツァール
    template: TEMP_NORMAL,
    main: "#059669",      // 輝くエメラルド
    sub: "#dc2626",       // 真紅のお腹
    beak: "#facc15",
    special: "#059669"
  },
  "C33": { // ヒゲワシ
    template: TEMP_RAPTOR,
    main: "#f59e0b",      // クリームサビ
    sub: "#475569",
    beak: "#4b5563",
    special: "#18181b"    // 黒いヒゲ
  },
  "C34": { // ウロコフウチョウ
    template: TEMP_NORMAL,
    main: "#111827",
    sub: "#06b6d4",       // ラディアントな青胸
    beak: "#18181b",
    special: "#06b6d4"
  },
  "C35": { // ハシビロコウ
    template: TEMP_LONG_BEAK,
    main: "#64748b",      // 静かなグレー
    sub: "#475569",
    beak: "#d97706",      // 巨大バケツクチバシ
    special: "#fbbf24"    // するどい眼光
  },
  "C36": { // カンムリワシ
    template: TEMP_RAPTOR,
    main: "#451a03",
    sub: "#f8fafc",
    beak: "#eab308",
    special: "#18181b"
  },
  "C37": { // オウギバト
    template: TEMP_NORMAL,
    main: "#1e40af",      // ロイヤール
    sub: "#60a5fa",       // 扇のトサカ
    beak: "#64748b",
    special: "#dc2626"
  },
  "C38": { // オオフラミンゴ
    template: TEMP_LONG_BEAK,
    main: "#f472b6",      // 鮮やかな桃
    sub: "#fce7f3",
    beak: "#18181b",      // 黒い先クチバシ
    special: "#fb7185"
  },
  "C39": { // ミヤマオウム
    template: TEMP_NORMAL,
    main: "#3f6212",      // 深緑
    sub: "#ea580c",       // 火のようなオレンジ
    beak: "#18181b",
    special: "#ea580c"
  },
  "C40": { // ミノバト
    template: TEMP_NORMAL,
    main: "#0d9488",
    sub: "#b45309",       // 銅色
    beak: "#1c1917",
    special: "#0d9488"
  },
  "C41": { // カンムリシロムク
    template: TEMP_NORMAL,
    main: "#ffffff",      // 純白
    sub: "#f8fafc",
    beak: "#ca8a04",
    special: "#3b82f6"    // 青い顔の裸出部
  },
  "C42": { // クロエリハクチョウ
    template: TEMP_LONG_BEAK,
    main: "#ffffff",      // 体は白
    sub: "#111827",       // ネックが黒
    beak: "#dc2626",      // つま先コブが赤
    special: "#cbd5e1"
  },
  "C43": { // コトドリ
    template: TEMP_NORMAL,
    main: "#78350f",
    sub: "#ea580c",
    beak: "#18181b",
    special: "#b45309"
  },
  "C44": { // ヘラサギ
    template: TEMP_LONG_BEAK,
    main: "#ffffff",
    sub: "#fef08a",
    beak: "#111827",      // スプーンクチバシ
    special: "#eab308"
  },
  "C45": { // マイコドリ
    template: TEMP_NORMAL,
    main: "#111827",      // 黒
    sub: "#dc2626",       // 真っ赤な頭
    beak: "#faf5ff",
    special: "#fbbf24"
  },
  "C46": { // オオサイチョウ
    template: TEMP_LONG_BEAK,
    main: "#18181b",
    sub: "#ffffff",
    beak: "#eab308",      // デカカスク黄色
    special: "#ea580c"
  },
  "C47": { // ヤツガシラ
    template: TEMP_LONG_BEAK,
    main: "#f59e0b",      // 綺麗な砂橙
    sub: "#18181b",       // 扇トサカの黒白
    beak: "#1c1917",
    special: "#ffffff"
  },
  "C48": { // オオルリ
    template: TEMP_NORMAL,
    main: "#1d4ed8",      // 瑠璃色
    sub: "#ffffff",       // 白腹
    beak: "#18181b",
    special: "#1e3a8a"
  },
  "C49": { // コマドリ
    template: TEMP_NORMAL,
    main: "#b45309",      // 茶
    sub: "#ea580c",       // 鮮烈なオレンジ顔
    beak: "#18181b",
    special: "#27272a"
  },
  "C50": { // オナガ
    template: TEMP_NORMAL,
    main: "#60a5fa",      // 水白グラデ
    sub: "#f8fafc",
    beak: "#111827",
    special: "#111827"    // 黒いベレー帽
  },
  "C51": { // マヒワ
    template: TEMP_NORMAL,
    main: "#fbbf24",      // キマヒワ
    sub: "#65a30d",
    beak: "#b45309",
    special: "#18181b"
  },
  "C52": { // トラツグミ
    template: TEMP_NORMAL,
    main: "#ca8a04",      // 虎毛
    sub: "#18181b",       // 黒い三日月斑
    beak: "#52525b",
    special: "#18181b"
  },
  "C53": { // クマゲラ
    template: TEMP_LONG_BEAK,
    main: "#111827",      // 漆黒
    sub: "#3f3f46",
    beak: "#f1f5f9",      // 灰白クチバシ
    special: "#dc2626"    // 赤いベレー
  },
  "C54": { // イソヒヨドリ
    template: TEMP_NORMAL,
    main: "#2563eb",      // ロイヤルブルー
    sub: "#9a3412",       // 錆泥オレンジ
    beak: "#18181b",
    special: "#3b82f6"
  },
  "C55": { // イカル
    template: TEMP_NORMAL,
    main: "#cbd5e1",      // 灰色
    sub: "#18181b",       // 濃紺頭
    beak: "#facc15",      // 太い超巨大黄クチバシ
    special: "#18181b"
  },
  "C56": { // キセキレイ
    template: TEMP_LONG_BEAK,
    main: "#64748b",      // グレー
    sub: "#facc15",       // 鮮やか黄色ひよ
    beak: "#1e293b",
    special: "#ffffff"
  },
  "C57": { // トラフズク
    template: TEMP_OWL,
    main: "#7c2d12",
    sub: "#451a03",
    beak: "#111827",
    special: "#ea580c"    // 燃える羽角・目
  },
  "C58": { // アトリ
    template: TEMP_NORMAL,
    main: "#ea580c",      // オレンジ胸
    sub: "#18181b",       // 縞
    beak: "#fbbf24",
    special: "#ffffff"
  },
  "C59": { // ブッポウソウ
    template: TEMP_NORMAL,
    main: "#0d9488",      // エメラルドブルー
    sub: "#3949ab",       // 深い瑠璃色
    beak: "#f43f5e",      // 真っ赤なクチバシ
    special: "#f43f5e",
    leg: "#f43f5e"
  },
  "C60": { // ホオジロ
    template: TEMP_NORMAL,
    main: "#a16207",
    sub: "#ffffff",       // 顔の白と黒
    beak: "#4b5563",
    special: "#18181b"
  },
  "C61": { // アオバト
    template: TEMP_NORMAL,
    main: "#84cc16",      // オリーブ黄緑
    sub: "#7c2d12",       // ぶどう色の飾り羽
    beak: "#38bdf8",      // 美しい水色のくちばし！
    special: "#7c2d12"
  },
  "C62": { // ヒヨドリ
    template: TEMP_NORMAL,
    main: "#52525b",      // グレー
    sub: "#a1a1aa",       // かすり
    beak: "#18181b",
    special: "#9a3412"    // 頬の茶斑！
  },
  "C63": { // ムネアカタヒバリ
    template: TEMP_NORMAL,
    main: "#a16207",
    sub: "#fda4af",       // 桃色胸
    beak: "#b45309",
    special: "#fda4af"
  },
  "C64": { // ゴジュウカラ
    template: TEMP_NORMAL,
    main: "#475569",      // ブルーグレー
    sub: "#fafaf9",       // 下白
    beak: "#27272a",
    special: "#111827"    // 黒い過眼線
  },
  "C65": { // シジュウカラ
    template: TEMP_NORMAL,
    main: "#18181b",      // 黒頭
    sub: "#ffffff",       // 白頬ピュア
    beak: "#18181b",
    special: "#84cc16"    // 背中の黄緑
  },
  "C66": { // ジョウビタキ
    template: TEMP_NORMAL,
    main: "#ea580c",      // 美しいジョウビタキオレンジ
    sub: "#3f3f46",       // グレー
    beak: "#111827",
    special: "#ffffff"    // 自慢の白い紋点！
  },
  "C67": { // アオサギ
    template: TEMP_LONG_BEAK,
    main: "#cbd5e1",      // 堂々たるグレー
    sub: "#ffffff",
    beak: "#eab308",      // 濃い黄色くちばし
    special: "#18181b"    // 黒い飾り羽
  },
  "C68": { // ゴイサギ
    template: TEMP_LONG_BEAK,
    main: "#1e3a8a",      // 濃紺
    sub: "#f1f5f9",
    beak: "#1c1917",
    special: "#ef4444"    // 妖しい輝きの赤い目
  },
  "C69": { // ニュウナイスズメ
    template: TEMP_NORMAL,
    main: "#b45309",      // 栗茶色
    sub: "#f1f5f9",       // 頬は白いまま（通常スズメと違い黒斑なし）
    beak: "#111827",
    special: "#b45309"
  },
  "C70": { // シロハラ
    template: TEMP_NORMAL,
    main: "#78350f",
    sub: "#e4e4e7",       // 中央が真っ白な腹
    beak: "#facc15",
    special: "#eab308"
  },
  "C71": { // カシラダカ
    template: TEMP_NORMAL,
    main: "#78350f",
    sub: "#f8fafc",
    beak: "#b45309",
    special: "#451a03"    // 黒トサカ
  },
  "C72": { // イカルチドリ
    template: TEMP_NORMAL,
    main: "#ca8a04",
    sub: "#ffffff",
    beak: "#111827",
    special: "#27272a"    // 首のリング
  },
  "C73": { // カケス
    template: TEMP_NORMAL,
    main: "#ca8a04",      // 桃茶
    sub: "#60a5fa",       // 翼の水色パッチ
    beak: "#111827",
    special: "#111827"    // 黒ヒゲ
  },
  "C74": { // カヤクグリ
    template: TEMP_NORMAL,
    main: "#5c3d2e",
    sub: "#3f3f46",
    beak: "#18181b",
    special: "#3f3f46"
  },
  "C75": { // キバシリ
    template: TEMP_LONG_BEAK,
    main: "#78350f",
    sub: "#fafaf9",       // 真白
    beak: "#1c1917",
    special: "#ffffff"    // 白い眉が明瞭
  },
  "C77": { // シロガシラ
    template: TEMP_NORMAL,
    main: "#52525b",
    sub: "#a1a1aa",
    beak: "#111827",
    special: "#ffffff"    // 後頭部のトレード白い毛！
  },
  "C78": { // オオバン
    template: TEMP_NORMAL,
    main: "#18181b",      // 全身漆黒
    sub: "#27272a",
    beak: "#ffffff",      // 額からクチバシまで鮮やかな純白！
    special: "#f43f5e"    // 目が赤
  },
  "C79": { // ビンズイ
    template: TEMP_NORMAL,
    main: "#71717a",
    sub: "#fafaf9",
    beak: "#b45309",
    special: "#18181b"
  }
};

// Helper to generate a simple deterministic hash from string for procedural styling
const getHashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

interface BirdPixelArtProps {
  charId?: string;
  jpName?: string;
  element?: ElementType | string;
  size?: number;
  className?: string;
}

export const BirdPixelArt: React.FC<BirdPixelArtProps> = ({
  charId = "",
  jpName = "",
  element,
  size = 48,
  className = ""
}) => {
  const idUpper = charId.toUpperCase();

  // Find pre-defined high fidelity bird styles
  const mappedStyle = BIRD_STYLES[charId] || BIRD_STYLES[idUpper];

  let template = TEMP_NORMAL;
  let mainColor = "#22c55e"; // default green
  let subColor = "#fcd34d";  // default gold/yellow
  let beakColor = "#f59e0b"; // orange/yellow beak
  let eyeColor = "#ffffff";  // white sclera
  let pupilColor = "#0f172a"; // dark pupil
  let legColor = "#78350f";   // brown legs
  let specialColor = "#ef4444"; // default red details

  if (mappedStyle) {
    template = mappedStyle.template;
    mainColor = mappedStyle.main;
    subColor = mappedStyle.sub;
    beakColor = mappedStyle.beak;
    if (mappedStyle.special) specialColor = mappedStyle.special;
    if (mappedStyle.leg) legColor = mappedStyle.leg;
    if (mappedStyle.eye) eyeColor = mappedStyle.eye;
    if (mappedStyle.pupil) pupilColor = mappedStyle.pupil;
  } else {
    // Procedural Fallback based on elements / name hash
    const hash = getHashCode(charId || jpName || "Bird");
    
    // Choose template based on hash
    const templates = [TEMP_NORMAL, TEMP_RAPTOR, TEMP_LONG_BEAK, TEMP_OWL];
    template = templates[hash % templates.length];

    // Style colors base on Element type
    const elem = (element || "").toString().toUpperCase();
    if (elem.includes("TERRA") || elem.includes("FLAME_KINDLING")) {
      mainColor = hash % 2 === 0 ? "#15803d" : "#854d0e"; // Green or Brown
      subColor = "#fde047"; // Yellow
      beakColor = "#ea580c";
      specialColor = "#fb923c";
    } else if (elem.includes("FLAME")) {
      mainColor = hash % 2 === 0 ? "#b91c1c" : "#ea580c"; // Red or Deep Orange
      subColor = "#facc15"; // Yellow
      beakColor = "#1e293b";
      specialColor = "#f43f5e";
    } else if (elem.includes("AQUA") || elem.includes("WATER")) {
      mainColor = hash % 2 === 0 ? "#0284c7" : "#2563eb"; // Blue
      subColor = "#e0f2fe"; // Light sky blue
      beakColor = "#0f172a";
      specialColor = "#38bdf8";
    } else if (elem.includes("GALE") || elem.includes("WIND")) {
      mainColor = hash % 2 === 0 ? "#0d9488" : "#059669"; // Emerald/Teal
      subColor = "#ccfbf1"; // Soft teal white
      beakColor = "#4b5563";
      specialColor = "#2dd4bf";
    } else if (elem.includes("DARK") || elem.includes("SHADOW")) {
      mainColor = hash % 2 === 0 ? "#111827" : "#312e81"; // Obsidian or Deep Indigo
      subColor = "#475569"; // Charcoal
      beakColor = "#020617";
      specialColor = "#a21caf"; // Deep Purple magenta
    } else if (elem.includes("COSMOS") || elem.includes("LIGHT")) {
      mainColor = hash % 2 === 0 ? "#701a75" : "#be185d"; // Mystical Magenta
      subColor = "#fdf2f8"; // Pure white/pink sheen
      beakColor = "#d97706"; // Amber gold
      specialColor = "#f472b6";
    } else {
      // Default / Physical / Neutral
      mainColor = hash % 2 === 0 ? "#78350f" : "#4b5563"; 
      subColor = "#f3f4f6";
      beakColor = "#d97706";
      specialColor = "#f59e0b";
    }
  }

  // Draw 32x32 Grid as high-contrast crispy SVG
  const gridRows = 32;
  const gridCols = 32;

  return (
    <svg
      viewBox={`0 0 ${gridCols} ${gridRows}`}
      width={size}
      height={size}
      className={`select-none ${className}`}
      style={{ shapeRendering: "crispEdges" }}
    >
      {template.map((row, rIdx) => {
        return row.split("").map((char, cIdx) => {
          let color = "transparent";
          if (char === "#") color = mainColor;
          else if (char === "a") color = subColor;
          else if (char === "b") color = beakColor;
          else if (char === "e") color = eyeColor;
          else if (char === "p") color = pupilColor;
          else if (char === "l") color = legColor;
          else if (char === "s") color = specialColor;

          if (color === "transparent") return null;

          return (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width="1.05" // slightly larger to prevent subpixel hairline cracks
              height="1.05"
              fill={color}
            />
          );
        });
      })}
    </svg>
  );
};
