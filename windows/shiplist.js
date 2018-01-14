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
    ships: null, // 艦娘全員
    userdefined: [],

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

            case 3: // 火力
                tmpa = a.api_karyoku[0];
                tmpb = b.api_karyoku[0];
                break;
            case 4: // 雷装
                tmpa = a.api_raisou[0];
                tmpb = b.api_raisou[0];
                break;
            case 5: // 対空
                tmpa = a.api_taiku[0];
                tmpb = b.api_taiku[0];
                break;
            case 6: // 対潜
                tmpa = a.api_taisen[0];
                tmpb = b.api_taisen[0];
                break;
            case 7: // 索敵
                tmpa = a.api_sakuteki[0];
                tmpb = b.api_sakuteki[0];
                break;


            case 99: // 入渠時間
                tmpa = a.api_ndock_time;
                tmpb = b.api_ndock_time;
                break;
            }
            return (tmpa - tmpb) * order;
        } );
    },

    sortList: function( type ){
        switch( type ){
        case 'sort-type':
            this.sort( this._show_ships, 0 );
            break;
        case 'sort-lv':
            this.sort( this._show_ships, 1 );
            break;
        case 'sort-cond':
            this.sort( this._show_ships, 2 );
            break;
        case 'sort-karyoku':
            this.sort( this._show_ships, 3 );
            break;
        case 'sort-raisou':
            this.sort( this._show_ships, 4 );
            break;
        case 'sort-taiku':
            this.sort( this._show_ships, 5 );
            break;
        case 'sort-taisen':
            this.sort( this._show_ships, 6 );
            break;
        case 'sort-sakuteki':
            this.sort( this._show_ships, 7 );
            break;
        case 'sort-repairtime':
            this.sort( this._show_ships, 99 );
            break;
        }
        this.createTable( this._show_ships );
    },

    /**
     * 入渠中であればtrueを返す.
     * @param ship_id
     * @returns {boolean}
     */
    isRepairing: function( ship_id ){
        for( let n of KanColle.ndock ){
            if( n.api_ship_id == ship_id ) return true;
        }
        return false;
    },

    /**
     * 艦娘一覧表示のテーブルを作成する.
     * @param ships
     */
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
            let ship_karyoku = elem.querySelector( '.ship-karyoku' );
            let ship_raisou = elem.querySelector( '.ship-raisou' );
            let ship_taiku = elem.querySelector( '.ship-taiku' );
            let ship_taisen = elem.querySelector( '.ship-taisen' );

            elem.setAttribute( 'ship_id', ship.api_id );

            no.textContent = i + 1;
            ship_type.textContent = ship._stype_name;
            let fleet_no = this.getFleetNo( ship.api_id );
            ship_name.textContent = (fleet_no > 0 ? `(${fleet_no})` : '') + ship._name;

            let ratio = ship.api_nowhp / ship.api_maxhp;
            if( ratio <= 0 ){
            }else if( ratio <= 0.25 ){
                $( ship_repairtime ).addClass( 'large-damage' );
            }else if( ratio <= 0.5 ){
                $( ship_repairtime ).addClass( 'medium-damage' );
            }else if( ratio <= 0.75 ){
                $( ship_repairtime ).addClass( 'small-damage' );
            }
            if( this.isRepairing( ship.api_id ) ){
                $( ship_name ).attr( 'icon', 'repair' );
            }

            $( ship_repairtime ).text( ship.api_ndock_time ? GetTimeString( ship.api_ndock_time / 1000 ) : '---' );

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
                if( ship.api_slot[i] == -1 ){
                    equip[i].textContent = '';
                    continue;
                }
                let item = KanColle._api_slot_item[ship.api_slot[i]];
                try{
                    equip[i].textContent = item._mst_data.api_name + (item.api_level > 0 ? '★+' + item.api_level : '')
                }catch( e ){
                    equip[i].textContent = '[Undetermined]';
                    $( equip[i] ).addClass( 'undetermined_weapon' );
                }
            }

            table.appendChild( elem );
        }
        $( '#shiplist tr' ).on( 'click', ( ev ) =>{
            this.showDetails( ev.currentTarget.getAttribute( 'ship_id' ) );
        } );
        $( 'table#tbl-shiplist tr' ).on( 'dragstart', function( ev ){
            ev.originalEvent.dataTransfer.setData( 'text/html', this.innerHTML );
            ev.originalEvent.dataTransfer.setData( 'text/plain', $( this ).attr( 'ship_id' ) );
        } );

    },

    /**
     * 艦娘の所属艦隊番号を返す
     * @param ship_id
     * @returns {integer}
     */
    getFleetNo: function( ship_id ){
        for( let fleet of KanColle.deck ){
            if( fleet.api_ship.includes( ship_id ) ){
                return fleet.api_id;
            }
        }
        return 0;
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

        for( let i = 0; i < 4; i++ ){
            slot[i].removeClass( 'undetermined_weapon' );
            if( ship.api_slot[i] > 0 ){
                let item = KanColle._api_slot_item[ship.api_slot[i]];
                try{
                    let str = ' ';
                    if( item.api_alv && item.api_alv > 0 ){
                        for( let i = 0; i < item.api_alv; i++ ){
                            str += '|';
                        }
                    }
                    str = (item._mst_data.api_name + (item.api_level > 0 ? '★+' + item.api_level : '') || '　') + str;
                    slot[i].text( str );

                    let color = GetEquipmentColor( item._mst_data );
                    let color2 = GetEquipmentSubColor( item._mst_data ) || color;
                    str = `box-shadow: -6px 0 0 0 ${color2}, -12px 0 0 0 ${color}; margin-left: 16px; padding-left: 4px;`;
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
                            if( v ) value.push( EquipmentParameterName[k] + v );
                            break;
                        }
                    }

                    document.querySelector( `#slot${i + 1}_spec` ).textContent = value.join( ' ' );
                }catch( e ){
                    slot[i].text( '[Undetermined]' );
                    slot[i].addClass( 'undetermined_weapon' );
                    document.querySelector( `#slot${i + 1}_spec` ).textContent = '';
                }
            }else{
                slot[i].text( '　' );
                slot[i].attr( 'style', '' );
                document.querySelector( `#slot${i + 1}_spec` ).textContent = '';
            }
            if( ship.api_onslot[i] > 0 ){
                let str = $( `#slot${i + 1}_spec` ).text();
                $( `#slot${i + 1}_spec` ).text( `(搭載 ${ship.api_onslot[i]}) ` + str );
            }
        }
    },

    filterByWeapon: function( item_id ){
        if( item_id == 0 ){
            this.createTable( this._show_ships );
        }else{
            let filtered = this._show_ships.filter( ( ship ) =>{
                for( let i = 0, item; item = ship.api_slot[i]; i++ ){
                    if( item == -1 ) continue;
                    if( KanColle._api_slot_item[item]._mst_data.api_id == item_id ){
                        return true;
                    }
                }
                if( ship.api_slot_ex <= 0 ) return false;
                if( KanColle._api_slot_item[ship.api_slot_ex]._mst_data.api_id == item_id ){
                    return true;
                }
                return false;
            } );
            this.createTable( filtered );
        }
    },

    /**
     * 選択した艦娘一覧を表示する.
     * @param type
     */
    selectTreeItem: function( type ){
        console.log( type );
        $( '#weapon-filter' ).val( 0 );
        switch( type ){
        case 'fleet-1':
        case 'fleet-2':
        case 'fleet-3':
        case 'fleet-4':
            type.match( /fleet-(\d)/ );
            let n = parseInt( RegExp.$1 );
            let filtered = [];
            for( let i = 0, deck; deck = KanColle.deck[i]; i++ ){
                if( deck.api_id == n ){
                    for( let j = 0, ship; ship = deck.api_ship[j]; j++ ){
                        filtered.push( KanColle._api_ship[ship] );
                    }
                }
            }
            this.createTable( filtered );
            this._show_ships = filtered;
            break;

        case 'kind-all':
            this.createTable( this.ships );
            this._show_ships = this.ships;
            break;

        default:
            if( type.match( /kind-(\d+)/ ) ){
                // 艦種別表示
                let n = parseInt( RegExp.$1 );
                let filtered = this.ships.filter( ( s ) =>{
                    if( s._stype == n ){
                        return true;
                    }
                    if( (n == 8 || n == 9) && (s._stype == 8 || s._stype == 9) ){
                        return true;
                    }
                    return false;
                } );
                this.createTable( filtered );
                this._show_ships = filtered;
            }
            if( type.match( /kind-ud-(\d+)/ ) ){
                // ユーザー定義リスト
                let n = parseInt( RegExp.$1 );
                console.log( this.userdefined[n] );
                let filtered = this.ships.filter( ( s ) =>{
                    return this.userdefined[n].list.includes( s.api_id );
                } );
                this.createTable( filtered );
                this._show_ships = filtered;
            }
            break;
        }
    },

    createHistogram: function( ships ){
        let ship_histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for( let i = 0; i < ships.length; i++ ){
            let k = parseInt( ships[i].api_lv / 10 );
            ship_histogram[k]++;
        }

        let histogram = [];
        for( let i = 0; i < ship_histogram.length; i++ ){
            histogram.push( {
                key: d3.max( [i * 10, 1] ) + '-',
                value: ship_histogram[i]
            } );
        }

        let margin = {top: 8, right: 30, bottom: 35, left: 20};
        let width = 800 - margin.left - margin.right;
        let height = 480 - margin.top - margin.bottom;

        let svg = d3.select( "#tabs-histogram" ).append( "svg" )
            .attr( "id", "svg-histogram" )
            .attr( "width", width + margin.left + margin.right )
            .attr( "height", height + margin.top + margin.bottom )
            .append( "g" )
            .attr( "transform", `translate(${margin.left},${margin.top})` );

        let x = d3.scaleBand().rangeRound( [0, width] ).padding( 0.2 );
        let y = d3.scaleLinear().rangeRound( [height, 0] );

        let g = svg.append( "g" )
            .attr( "transform", `translate(${margin.left},${margin.top})` );

        x.domain( histogram.map( ( d ) =>{
            return d.key;
        } ) );
        y.domain( [0, d3.max( ship_histogram )] );

        g.append( "g" )
            .attr( "transform", `translate(0,${height})` )
            .call( d3.axisBottom( x ) );

        g.append( "g" )
            .attr( 'class', 'horizontal-line' )
            .call( d3.axisLeft( y )
                .tickSizeInner( -width ).tickSizeOuter( 0 )
                .tickFormat( function( d ){
                    return d + "隻";
                } )
            );

        g.selectAll( ".bar" )
            .data( histogram )
            .enter().append( "rect" )
            .attr( "class", "bar" )
            .attr( "x", function( d ){
                return x( d.key );
            } )
            .attr( "y", function( d ){
                return y( d.value );
            } )
            .attr( "width", x.bandwidth() )
            .attr( "height", function( d ){
                return height - y( d.value );
            } );
    },

    createPieChart: function( ships ){
        RemoveChildren( document.getElementById( 'pieChart' ) );

        let data = {};
        data.content = [];
        data.sortOrder = "value-desc";

        let lv_threshold = parseInt( $( '#level-threshold' ).val() );

        let tmp = {};
        ships.forEach( function( d ){
            if( d.api_lv < lv_threshold ) return;
            let data = d._mst_data;
            let k = data.api_stype;
            if( k == 9 ) k = 8; // 9=高速戦艦
            if( !tmp[k] ){
                tmp[k] = {};
                tmp[k].label = d._stype_name;
                tmp[k].value = 0;
            }
            tmp[k].value++;
        } );
        for( let o in tmp ){
            data.content.push( tmp[o] );
        }

        this._pie = new d3pie( "pieChart", {
            "header": {
                "title": {
                    "text": "艦娘の艦種別構成比",
                    "fontSize": 24,
                    "font": "ヒラギノ角ゴ Pro"
                }
            },
            "size": {
                "canvasWidth": 640,
                "canvasHeight": 512,
                "pieOuterRadius": "95%"
            },
            "data": data,
            "tooltips": {
                enabled: true,
                type: "placeholder",
                string: "{label}, {value}隻, {percentage}%"
            },
            "labels": {
                "outer": {
                    "pieDistance": 14,
                    "format": "label-value1"
                },
                "mainLabel": {
                    "fontSize": 12,
                    "font": "ヒラギノ角ゴ Pro"
                },
                "percentage": {
                    "color": "#ffffff",
                    "decimalPlaces": 1
                },
                "value": {
                    "color": "#adadad",
                    "fontSize": 12
                },
                "lines": {
                    "enabled": true,
                    "style": "straight"
                },
                "truncation": {
                    "enabled": true
                }
            },
            "effects": {
                "pullOutSegmentOnClick": {
                    "effect": "linear",
                    "speed": 200,
                    "size": 8
                }
            },
            "misc": {
                "gradient": {
                    "enabled": true,
                    "percentage": 100
                },
                "pieCenterOffset": {
                    "x": 20,
                    "y": 7,
                }
            }
        } );
    },


    saveUserDefinedList: function(){
        localStorage.setItem( 'ship-ud-list', JSON.stringify( this.userdefined ) );
    },

    removeFromListContextMenu: function( key, options ){
        let elem = options.$trigger[0];
        let ship_id = parseInt( $( elem ).attr( 'ship_id' ) );

        let sel = $( '#left' ).jstree( 'get_selected' );
        if( sel[0].match( /kind-ud-(\d+)/ ) ){
            // ユーザー定義リスト
            let n = parseInt( RegExp.$1 );

            let tmp = this.userdefined[n].list.filter( ( id ) =>{
                return id != ship_id;
            } );
            this.userdefined[n].list = tmp;
            this.selectTreeItem( sel[0] );
        }
    },

    treeContextMenu: function( key, options ){
        let elem = options.$trigger[0];
        let n = elem.id.match( /kind-ud-(\d+)/ );
        n = n && n[1] || -1;
        console.log( n );

        let name;
        switch( key ){
        case'new-list':
            name = prompt( "新規リストの名前を入力", "" );
            $( '#left' ).jstree( 'create_node',
                'kind-user-defined',
                {
                    id: `kind-ud-${this.userdefined.length}`,
                    class: 'user-defined',
                    text: name
                } );

            this.userdefined.push( {
                'name': name,
                'list': []
            } );
            this.saveUserDefinedList();
            this.initDropEvent();
            break;

        case 'rename-list':
            if( n < 0 ) return;
            name = prompt( "新しい名前を入力", this.userdefined[n].name );
            this.userdefined[n].name = name;
            this.saveUserDefinedList();

            $( '#left' ).jstree( 'rename_node', elem, name );
            this.initDropEvent();
            break;

        case 'delete-list':
            if( n < 0 ) return;
            let yes = confirm( `削除しますか？ "${this.userdefined[n].name}"` );
            if( yes ){
                $( '#left' ).jstree( 'delete_node', elem );

                delete this.userdefined[n];
                this.saveUserDefinedList();
                this.initDropEvent();
            }
            break;
        }
    },

    initTabs: function(){
        $( "#tabs" ).tabs( {
            activate: function( event, ui ){
                console.log( ui );
                if( ui.newPanel[0].id == 'tabs-piechart' ){
                    ShipList.createPieChart( ShipList.ships );
                }
            }
        } );
    },

    initEquipmentFilterMenu: function(){
        let tmp = {};
        for( let k in KanColle._api_slot_item ){
            if( k == -1 ) continue;
            let d = KanColle._api_slot_item[k];
            tmp[d._mst_data.api_name] = d._mst_data;
        }
        let keys = d3.map( tmp ).keys();
        keys.sort( ( a, b ) =>{
            return tmp[a].api_id - tmp[b].api_id;
        } );
        for( let i = 0; i < 4; i += 2 ){
            keys.sort( function( a, b ){
                return tmp[a].api_type[i] - tmp[b].api_type[i];
            } );
        }
        keys.forEach( function( d ){
            let menuitem = document.createElement( 'option' );
            let color = GetEquipmentColor( tmp[d] );
            menuitem.appendChild( document.createTextNode( d ) );
            menuitem.setAttribute( "style", `border-left: ${color} 16px solid;` );
            menuitem.setAttribute( 'value', tmp[d].api_id );
            $( '#weapon-filter' ).append( menuitem );
        } );
    },

    initUserDefinedListTree: function(){
        try{
            let tmp = localStorage.getItem( 'ship-ud-list' );
            if( tmp ){
                this.userdefined = JSON.parse( tmp );
            }
        }catch( e ){
            console.log( e );
        }
        let treeview = $( '#show-by-user-definition' );
        for( let i = 0, d; d = this.userdefined[i]; i++ ){
            if( !d ) continue;
            let li = document.createElement( 'li' );
            $( li ).attr( 'id', `kind-ud-${i}` );
            $( li ).text( d.name );
            treeview.append( li );
        }
    },

    initTreeView: function( ships ){
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
        this.initUserDefinedListTree();

        $( '#left' ).on( 'select_node.jstree', ( ev, data ) =>{
            this.selectTreeItem( data.selected[0] );
        } ).jstree( {
            'core': {
                'multiple': false,
                "check_callback": true
            }
        } );

        $.contextMenu( {
            selector: '#kind-user-defined, #kind-user-defined .jstree-node',
            build: ( $triggerElement, e ) =>{
                let menuobj = {
                    zIndex: 10,
                    callback: ( key, options ) =>{
                        this.treeContextMenu( key, options );
                    },
                    items: {
                        "new-list": {name: "新規リスト作成"},
                        "rename-list": {name: "名前変更"},
                        "delete-list": {name: "リスト削除"},
                    }
                };
                return menuobj;
            },
        } );
    },

    /**
     * ユーザー定義リストへのドロップイベントの設定.
     * ツリービューの表示を変更すると設定しなおしになる。
     */
    initDropEvent: function(){
        $( 'li#kind-user-defined li.jstree-node' ).on( 'dragenter', function( ev ){
            ev.preventDefault();
            $( this ).addClass( 'dragover' );
        } );
        $( 'li#kind-user-defined li.jstree-node' ).on( 'dragover', function( ev ){
            ev.preventDefault();
        } );
        $( 'li#kind-user-defined li.jstree-node' ).on( 'dragleave', function( ev ){
            ev.preventDefault();
            $( this ).removeClass( 'dragover' );
        } );
        $( 'li#kind-user-defined li.jstree-node' ).on( 'drop', function( ev ){
            $( this ).removeClass( 'dragover' );
            ev.preventDefault();
            let ship_id = ev.originalEvent.dataTransfer.getData( 'text/plain' );

            let elem = FindParentElement( ev.target, 'li' );
            let tmp = elem && elem.id.match( /kind-ud-(\d+)/ );
            if( tmp ){
                let n = tmp[1];
                ship_id = parseInt( ship_id );
                if( !ShipList.userdefined[n].list.includes( ship_id ) ){
                    ShipList.userdefined[n].list.push( ship_id );
                    ShipList.saveUserDefinedList();
                }
            }
        } );
    },

    initSeparator: function(){
        let mousedown = ( ev ) =>{
            $( window ).on( 'mousemove', ( ev ) =>{
                let w = ev.originalEvent.clientX;
                // TODO ウィンドウがリサイズされたときに調整をする
                $( 'div#left' )[0].style.width = w + 'px';
                $( 'div#right' )[0].style.width = ($( window ).width() - w) + 'px';
            } );
            $( window ).on( 'mouseup', ( ev ) =>{
                $( window ).off( 'mouseup' );
                $( window ).off( 'mousemove' );
            } );
        };

        $( 'div#separator' ).on( 'mousedown', ( ev ) =>{
            mousedown( ev );
        } );

    },

    init: async function(){
        this.initTabs();
        this.initSeparator();

        // プライベートブラウジングモードだと使えない手法だが
        // 物は試しと、手抜きのため。
        let bg = await browser.runtime.getBackgroundPage();
        KanColle = bg.GetKanColle();

        let ships = [];
        for( let i in KanColle._api_ship ){
            ships.push( KanColle._api_ship[i] );
        }

        this.ships = ships;
        this._show_ships = ships;
        this.sort( this.ships, 0 );
        this.createTable( this.ships );
        this.createHistogram( this.ships );

        // 装備フィルターメニュー
        this.initEquipmentFilterMenu();

        // 艦種別リストを作成
        this.initTreeView( ships );
        this.initDropEvent();

        $( '#level-threshold' ).on( 'change', ( ev ) =>{
            this.createPieChart( this.ships );
        } );

        $( '#weapon-filter' ).on( 'change', ( ev ) =>{
            this.filterByWeapon( $( '#weapon-filter' ).val() );
        } );

        $( 'th.list-sort' ).on( 'click', function( ev ){
            let id = $( this ).attr( 'id' );
            ShipList.sortList( id );
        } );

        $.contextMenu( {
            selector: 'table#tbl-shiplist tr',
            build: ( $triggerElement, e ) =>{
                let menuobj = {
                    zIndex: 10,
                    callback: ( key, options ) =>{
                        this.removeFromListContextMenu( key, options );
                    },
                    items: {
                        "remove": {name: "削除"}
                    }
                };
                return menuobj;
            },
        } );

    },

    unload: function(){
        let tmp = this.userdefined.filter( ( v ) =>{
            return v;
        } );
        if( !tmp ) tmp = [];
        localStorage.setItem( 'ship-ud-list', JSON.stringify( tmp ) );
    }
};

window.addEventListener( 'load', ( ev ) =>{
    ShipList.init();
} );

window.addEventListener( 'unload', ( ev ) =>{
    ShipList.unload();
} );
