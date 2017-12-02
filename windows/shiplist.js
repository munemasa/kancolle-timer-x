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

let KanColle = {};


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


let ShipList = {
        ships: null,

        /**
         * 艦娘リスト（配列）をソート
         * @param ships 艦娘配列
         * @param type ソート種別
         */
        sort: function( ships, type ){
            ships.sort( function( a, b ){
                var tmpa = 0;
                var tmpb = 0;
                var order = -1;
                switch( type ){
                case 0: // 艦種
                    tmpa = a._mst_data.api_stype;
                    tmpb = b._mst_data.api_stype;
                    if( tmpa == tmpb ){
                        tmpa = b._mst_data.api_sortno;
                        tmpb = a._mst_data.api_sortno;
                    }
                    break;
                case 1: // レベル
                    tmpa = a.api_lv;
                    tmpb = b.api_lv;
                    if( tmpa == tmpb ){
                        tmpa = b._mst_data.api_sortno;
                        tmpb = a._mst_data.api_sortno;
                    }
                    break;
                case 2: // 状態
                    tmpa = a.api_cond;
                    tmpb = b.api_cond;
                    break;
                case 3: // 入渠時間
                    tmpa = a.api_ndock_time;
                    tmpb = b.api_ndock_time;
                    break;
                }
                return (tmpa - tmpb) * order;
            } );
        },


        createTable: function( ships ){
            let table = document.querySelector( '#shiplist' )
            $( '#shiplist tr' ).remove();

            for( let i = 0, ship; ship = ships[i]; i++ ){
                let t = document.querySelector( '#template-ship' );
                let clone2 = document.importNode( t.content, true );
                let elem = clone2.firstElementChild;

                let no = elem.querySelector( '.ship-no' );
                let ship_type = elem.querySelector( '.ship-type' );
                let ship_name = elem.querySelector( '.ship-name' );
                let ship_level = elem.querySelector( '.ship-level' );
                let ship_cond = elem.querySelector( '.ship-cond' );
                let ship_search = elem.querySelector( '.ship-search' );
                let ship_exp = elem.querySelector( '.ship-exp' );
                let ship_payload = elem.querySelector( '.ship-payload' );
                let ship_equip1 = elem.querySelector( '.ship-equip1' );
                let ship_equip2 = elem.querySelector( '.ship-equip2' );
                let ship_equip3 = elem.querySelector( '.ship-equip3' );
                let ship_equip4 = elem.querySelector( '.ship-equip4' );
                let ship_karyoku = elem.querySelector( '.ship-karyoku' );
                let ship_raisou = elem.querySelector( '.ship-raisou' );
                let ship_taiku = elem.querySelector( '.ship-taiku' );
                let ship_taisen = elem.querySelector( '.ship-taisen' );

                elem.setAttribute( 'ship_id', ship.api_id );

                no.textContent = i + 1;
                ship_type.textContent = ship._stype_name;
                ship_name.textContent = ship._name;
                ship_level.textContent = ship.api_lv;

                ship_cond.textContent = ship.api_cond;
                /* デコレーション */
                if( ship.api_cond <= 19 ){
                    ship_cond.setAttribute( 'cond', 'very-low' );
                }else if( ship.api_cond <= 29 ){
                    ship_cond.setAttribute( 'cond', 'low' );
                }else if( ship.api_cond >= 50 ){
                    ship_cond.setAttribute( 'cond', 'high' );
                }

                ship_karyoku.textContent = ship.api_karyoku[0];
                ship_raisou.textContent = ship.api_raisou[0];
                ship_taiku.textContent = ship.api_taiku[0];
                ship_taisen.textContent = ship.api_taisen[0];

                ship_search.textContent = ship.api_sakuteki[0];
                ship_exp.textContent = ship.api_exp[2] + '%';
                ship_payload.textContent = d3.sum( ship.api_onslot );

                let equip = [ship_equip1, ship_equip2, ship_equip3, ship_equip4];
                for( let i = 0; i < 4; i++ ){
                    let item = KanColle._api_slot_item[ship.api_slot[i]];
                    equip[i].textContent = item._mst_data.api_name;
                }

                table.appendChild( elem );
            }
            $( '#shiplist tr' ).on( 'click', ( ev ) =>{
                this.showDetails( ev.currentTarget.getAttribute( 'ship_id' ) );
            } );
        },


        showDetails: function( ship_id ){
            let ship = KanColle._api_ship[ship_id];

            $( '#api_stype' ).text( ship._stype_name );
            $( '#api_name' ).text( ship._name );
            $( '#api_lv' ).text( `Lv ${ship.api_lv}` );
            $( '#api_maxhp' ).text( ship.api_maxhp );
            $( '#api_soukou' ).text( ship.api_soukou[0] );
            $( '#api_kaihi' ).text( ship.api_kaihi[0] );
            $( '#api_onslot' ).text( d3.sum( ship.api_onslot ) );
            $( '#api_soku' ).text( ship._mst_data.api_soku < 10 ? "低速" : "高速" );
            $( '#api_leng' ).text( ["", "短", "中", "長", "超長"][ship.api_leng] );
            $( '#api_karyoku' ).text( ship.api_karyoku[0] );
            $( '#api_raisou' ).text( ship.api_raisou[0] );
            $( '#api_taiku' ).text( ship.api_taiku[0] );
            $( '#api_taisen' ).text( ship.api_taisen[0] );
            $( '#api_sakuteki' ).text( ship.api_sakuteki[0] );
            $( '#api_lucky' ).text( ship.api_lucky[0] );
            $( '#api_exp' ).text( `Exp ${FormatCommas( ship.api_exp[0] )}` );
            $( '#api_exp_next' ).text( FormatCommas( ship.api_exp[1] ) );

            $( '#api_slot_ex' ).text( ship.api_slot_ex > 0 ? KanColle._api_slot_item[ship.api_slot_ex]._mst_data.api_name : '' );

            // 装備の表示
            let slot = [$( '#api_slot1' ), $( '#api_slot2' ), $( '#api_slot3' ), $( '#api_slot4' )];
            let equip_parameter_name = {
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

            for( let i = 0; i < 4; i++ ){
                if( ship.api_slot[i] > 0 ){
                    let item = KanColle._api_slot_item[ship.api_slot[i]];
                    slot[i].text( item._mst_data.api_name + (item.api_level > 0 ? '★+' + item.api_level : '') || '　' );

                    let color = GetEquipmentColor( item._mst_data );
                    let color2 = GetEquipmentSubColor( item._mst_data ) || color;
                    let str = `box-shadow: -6px 0 0 0 ${color2}, -12px 0 0 0 ${color}; margin-left: 16px; padding-left: 4px;`;
                    slot[i].attr( 'style', str );

                    let value = [];
                    for( let k in item._mst_data ){
                        let v = GetSignedValue( item._mst_data[k] );
                        switch( k ){
                        case "api_houg": // 火力
                        case "api_raig": // 雷装
                        case "api_baku": // 爆装
                        case "api_tyku": // 対空
                        case "api_tais": // 対潜
                        case "api_houm": // 命中
                        case "api_houk": // 回避
                        case "api_saku": // 索敵
                        case "api_souk": // 装甲
                            //case "api_raim": // 雷撃命中
                            if( v ) value.push( equip_parameter_name[k] + v );
                            break;
                        }
                    }

                    document.querySelector( `#slot${i + 1}_spec` ).textContent = value.join( ' ' );
                }else{
                    slot[i].text( '　' );
                    slot[i].attr( 'style', '' );
                    document.querySelector( `#slot${i + 1}_spec` ).textContent = '';
                }
            }
        }
        ,

        select: function( type ){
            switch( type ){
            case 'fleet-1':
            case 'fleet-2':
            case 'fleet-3':
            case 'fleet-4':
                type.match( /fleet-(\d)/ );
                let n = parseInt( RegExp.$1 );
                let filtered = this.ships.filter( ( s ) =>{
                    for( let i = 0, deck; deck = KanColle.deck[i]; i++ ){
                        if( deck.api_id == n ){
                            if( deck.api_ship.includes( s.api_id ) ) return true;
                        }
                    }
                    return false;
                } );
                this.createTable( filtered );
                break;

            case 'kind-all':
                this.createTable( this.ships );
                break;

            default:
                if( type.match( /kind-(\d+)/ ) ){
                    // 艦種別表示
                    let n = parseInt( RegExp.$1 );
                    let filtered = this.ships.filter( ( s ) =>{
                        if( s._stype == n ){
                            return true;
                        }
                        if( (n == 8 || n == 9) && ( s._stype == 8 || s._stype == 9) ){
                            return true;
                        }
                        return false;
                    } );
                    this.createTable( filtered );
                }
                break;
            }
        }
        ,

        init: async function(){
            // プライベートブラウジングモードだと使えない手法だが
            // 物は試しと、手抜きのため。
            let bg = await browser.runtime.getBackgroundPage();
            KanColle = bg.GetKanColle();
            KanColle._api_slot_item[-1] = {
                _mst_data: {
                    api_name: ''
                }
            };

            let ships = [];
            for( let i in KanColle._api_ship ){
                ships.push( KanColle._api_ship[i] );
            }

            this.ships = ships;
            this.sort( this.ships, 0 );
            this.createTable( this.ships );

            // show-by-ship-type
            let treeview = $( '#show-by-ship-type' );
            let flg = {};
            for( let s of ships ){
                if( !flg[s._stype_name] ){
                    let li = document.createElement( 'li' );
                    $( li ).attr( 'id', `kind-${s._stype}` );
                    $( li ).text( s._stype_name );
                    treeview.append( li );
                    flg[s._stype_name] = true;
                }
            }

            $( '#left' ).on( 'select_node.jstree', ( ev, data ) =>{
                this.select( data.selected[0] );
            } ).jstree( {
                'core': {
                    'multiple': false
                }
            } );
        }
    }
;

window.addEventListener( 'load', ( ev ) =>{
    ShipList.init();
} );
