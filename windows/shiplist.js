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


    createTable: function(){
        let table = document.querySelector( '#shiplist' )
        $( '#shiplist tr' ).remove();

        for( let i = 0, ship; ship = this.ships[i]; i++ ){
            let t = document.querySelector( '#template-ship' );
            let clone2 = document.importNode( t.content, true );
            let elem = clone2.firstElementChild;

            let no = elem.querySelector( '.ship-no' );
            let ship_type = elem.querySelector( '.ship-type' );
            let ship_name = elem.querySelector( '.ship-name' );
            let ship_level = elem.querySelector( '.ship-level' );
            let ship_cond = elem.querySelector( '.ship-cond' );
            let ship_repairtime = elem.querySelector( '.ship-repairtime' );
            let ship_search = elem.querySelector( '.ship-search' );
            let ship_exp = elem.querySelector( '.ship-exp' );
            let ship_payload = elem.querySelector( '.ship-payload' );
            let ship_equip1 = elem.querySelector( '.ship-equip1' );
            let ship_equip2 = elem.querySelector( '.ship-equip2' );
            let ship_equip3 = elem.querySelector( '.ship-equip3' );
            let ship_equip4 = elem.querySelector( '.ship-equip4' );

            no.textContent = i + 1;
            ship_type.textContent = ship._stype_name;
            ship_name.textContent = ship._name;
            ship_level.textContent = ship.api_lv;
            ship_cond.textContent = ship.api_cond;
            ship_repairtime.textContent = ship.api_ndock_time > 0 ? GetTimeString( parseInt( ship.api_ndock_time / 1000 ) ) : '---';
            ship_search.textContent = ship.api_sakuteki[0];
            ship_exp.textContent = ship.api_exp[2] + '%';
            ship_payload.textContent = d3.sum( ship.api_onslot );
            ship_equip1.textContent = KanColle._api_slot_item[ship.api_slot[0]]._mst_data.api_name;
            ship_equip2.textContent = KanColle._api_slot_item[ship.api_slot[1]]._mst_data.api_name;
            ship_equip3.textContent = KanColle._api_slot_item[ship.api_slot[2]]._mst_data.api_name;
            ship_equip4.textContent = KanColle._api_slot_item[ship.api_slot[3]]._mst_data.api_name;

            table.appendChild( elem );
        }
    },

    init: async function(){
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

        this.createTable();

    }
};

window.addEventListener( 'load', ( ev ) =>{
    ShipList.init();
} );
