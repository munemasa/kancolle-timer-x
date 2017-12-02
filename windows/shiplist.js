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
            let ship_repairtime = elem.querySelector( '.ship-repairtime' );
            let ship_search = elem.querySelector( '.ship-search' );
            let ship_exp = elem.querySelector( '.ship-exp' );
            let ship_payload = elem.querySelector( '.ship-payload' );
            let ship_equip1 = elem.querySelector( '.ship-equip1' );
            let ship_equip2 = elem.querySelector( '.ship-equip2' );
            let ship_equip3 = elem.querySelector( '.ship-equip3' );
            let ship_equip4 = elem.querySelector( '.ship-equip4' );

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

        $( '#api_slot1' ).text( KanColle._api_slot_item[ship.api_slot[0]]._mst_data.api_name || '　' );
        $( '#api_slot2' ).text( KanColle._api_slot_item[ship.api_slot[1]]._mst_data.api_name || '　' );
        $( '#api_slot3' ).text( KanColle._api_slot_item[ship.api_slot[2]]._mst_data.api_name || '　' );
        $( '#api_slot4' ).text( KanColle._api_slot_item[ship.api_slot[3]]._mst_data.api_name || '　' );
    },

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
            console.log( data );
            console.log( data.selected[0] );
            this.select( data.selected[0] );
        } ).jstree( {
            'core': {
                'multiple': false
            }
        } );
    }
};

window.addEventListener( 'load', ( ev ) =>{
    ShipList.init();
} );
