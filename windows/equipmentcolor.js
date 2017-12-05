/*
 Copyright (c) 2017 amano <amano@miku39.jp>

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */


let EquipmentParameterName = {
    "api_houg": "火力",
    "api_raig": "雷装",
    "api_baku": "爆装",
    "api_tyku": "対空",
    "api_tais": "対潜",
    "api_houm": "命中",
    "api_houk": "回避",
    "api_saku": "索敵",
    "api_raim": "雷撃命中", // かな？
    "api_souk": "装甲"
};


// TODO 装備品一覧でも使うので整理したい
let EquipmentColor = {
    /*
     主砲 #d15b5b
     副砲 #ffea00
     対空砲 #66cc77
     魚雷 #5887ab
     艦載機 #39b74e
     偵察機 #8fcc99
     電探 #e89a35
     対潜 #7eccd8
     タービン #fdc24c
     三式弾 #71cd7e
     徹甲弾 #d15b5b
     機銃 #66cc77
     ダメコン #ffffff
     大発 #9aa55d
     カ号 #66cc77
     三式指揮 #7fccd8
     バルジ #9a7eaa
     ドラム缶 #a3a3a3
     */
    1: '#d15b5b',   // 主砲 1-16が高角砲
    2: '#d15b5b',   // 主砲
    3: '#d15b5b',   // 主砲
    4: '#ffea00',   // 副砲 4-16が高角砲
    5: '#5887ab',   // 魚雷
    6: '#39b74e',   // 制空戦闘機
    7: '#39b74e',   // 艦爆
    8: '#39b74e',   // 艦攻
    9: '#39b74e',   // 彩雲
    10: '#8fcc99',  // 偵察機・観測機
    11: '#8fcc99',  // 瑞雲・晴嵐
    12: '#e89a35',  // 電探
    13: '#e89a35',  // 電探
    14: '#7eccd8',  // 対潜兵器
    15: '#7eccd8',  // 対潜兵器
    17: '#fdc24c',  // タービン
    18: '#71cd7e',  // 三式弾
    19: '#d15b5b',  // 徹甲弾
    21: '#66cc77',  // 機銃
    22: '#5887ab',  // 甲標的
    23: '#ffffff',  // ダメコン
    24: '#9aa55d',  // 大発
    25: '#66cc77',  // カ号
    26: '#7fccd8',  // 三式式連絡機
    27: '#9a7eaa',  // バルジ
    28: '#9a7eaa',  // バルジ
    29: '#f28a47',  // 探照灯
    30: '#a3a3a3',  // ドラム缶
    31: '#b09d7f',  // 艦艇修理施設
    32: '#5887ab',  // 潜水艦艦首魚雷
    33: '#f28a47',  // 照明弾
    34: '#c8aaff',  // 艦隊司令部施設
    35: '#cda269',  // 熟練艦載機整備員
    36: '#899a4d',  // 91式高射装置
    37: '#ff3636',  // WG42
    38: '',
    39: '#bfeb9f', // 熟練見張員
    41: '#8fcc99', // 二式大艇
    42: '#f28a47', // 大型探照灯
    43: '#ffffff',	// 戦闘糧食
    44: '#78dcb5', // 洋上補給

    47: '#39b74e', // 九六式陸攻

    99: ''
};


/**
 * 装備アイテムの色を返す
 * @param d 装備アイテム
 * @returns 色を返す
 */
function GetEquipmentColor( d ){
    let color = EquipmentColor[d.api_type[2]];
    if( (d.api_type[2] == 1 || d.api_type[2] == 4) && d.api_type[3] == 16 ){
        // 主砲・副砲扱いの高角砲たち
        color = "#66cc77";
    }
    if( !color ){
        console.log( `Unknown color ${d.api_type[2]}` );
    }
    return color;
}

/**
 * 装備アイテムのサブカラーを返す
 * @param d
 */
function GetEquipmentSubColor( d ){
    let subcolor = {
        6: '#39b74e',	// 制空戦闘機
        7: '#ea6a6a',	// 艦爆
        8: '#65bcff',	// 艦攻
        9: '#ffc000'	// 彩雲
    };
    return subcolor[d.api_type[2]];
}

