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

let EquipmentList = {
    allequipments: [],

    create: function(){

        let e = document.querySelector( '#equipment-list' );
        let prev_name = '';
        let description;
        let spec_str;

        let cnt = 0;
        for( let i = 0, item; item = this.allequipments[i]; i++ ){
            let t = document.querySelector( '#template-equipment' );
            let clone2 = document.importNode( t.content, true );
            let elem = clone2.firstElementChild;

            let name = elem.querySelector( '.equip-name' );
            let ship_name = elem.querySelector( '.ship-name' );
            let specs = elem.querySelector( '.equip-specs' );

            let equip_name = item._mst_data.api_name;
            if( prev_name != equip_name ){
                prev_name = equip_name;

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
                        if( v ) value.push( EquipmentParameterName[k] + v );
                        break;
                    }
                }
                spec_str = value.join( ' ' );

                let label = document.createElement( 'label' );
                label.setAttribute( 'class', 'equip-specs' );
                label.appendChild( document.createTextNode( spec_str ) );
                e.appendChild( label );

                label = document.createElement( 'label' );
                label.setAttribute( 'class', 'equip-name' );
                label.setAttribute( 'for', '_' + item._mst_data.api_id );
                label.appendChild( document.createTextNode( equip_name ) );
                if( cnt++ % 2 ){
                    label.setAttribute( 'style', 'background-color: #efefef;' );
                }
                e.appendChild( label );

                let checkbox = document.createElement( 'input' );
                checkbox.setAttribute( 'type', 'checkbox' );
                checkbox.setAttribute( 'id', '_' + item._mst_data.api_id );
                checkbox.setAttribute( 'class', 'on-off' );
                e.appendChild( checkbox );

                description = document.createElement( 'table' );
                description.setAttribute( 'class', 'description' );
                e.appendChild( description );
            }

            name.textContent = equip_name;

            ship_name.textContent = `${item._owner_ship_name} ${item._owner_ship_lv}`;

            specs.textContent = spec_str;

            description.appendChild( elem );
        }

    },


    initEquipmentList: function(){
        // 装備アイテムリスト
        let item = KanColle._api_slot_item;

        this.allequipments = Object.keys( item ).map( function( key ){
            item[key]._owner_ship_name = '---';
            item[key]._owner_ship_lv = '';
            return item[key];
        } );

        // 装備品に装備艦娘名を設定
        for( let k in KanColle._api_ship ){
            let ship = KanColle._api_ship[k];
            for( let id of ship.api_slot ){
                if( id <= 0 ) continue;
                item[id]._owner_ship_name = ship._name;
                item[id]._owner_ship_lv = `(Lv${ship.api_lv})`;
            }
            if( ship.api_slot_ex > 0 ){
                let id = ship.api_slot_ex;
                item[id]._owner_ship_name = ship._name;
                item[id]._owner_ship_lv = `(Lv${ship.api_lv})`;
            }
        }

        // 艦これと同じ並びにする
        this.allequipments.sort( function( a, b ){
            return a.api_slotitem_id - b.api_slotitem_id;
        } );
        for( let i = 0; i < 4; i += 2 ){
            this.allequipments.sort( function( a, b ){
                return a._mst_data.api_type[i] - b._mst_data.api_type[i];
            } );
        }
    },

    init: async function(){
        let bg = await browser.runtime.getBackgroundPage();
        KanColle = bg.GetKanColle();

        this.initEquipmentList();
        this.create();
    }
};

window.addEventListener( 'load', ( ev ) =>{
    EquipmentList.init();
} );
