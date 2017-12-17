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

const MP3_MISSION_FINISHED = "http://miku39.jp/sounds/kancolle/missionfinished.mp3";
const MP3_MISSION_FINISH_SOON = "http://miku39.jp/sounds/kancolle/missionfinishedsoon.mp3";
const MP3_REPAIR_FINISHED = "http://miku39.jp/sounds/kancolle/repairfinished.mp3";
const MP3_REPAIR_FINISH_SOON = "http://miku39.jp/sounds/kancolle/repairfinishedsoon.mp3";
const MP3_BUILD_FINISHED = "http://miku39.jp/sounds/kancolle/constructionfinished.mp3";
const MP3_BUILD_FINISH_SOON = "http://miku39.jp/sounds/kancolle/constructionfinishedsoon.mp3";


/**
 * 音声を再生する.
 * @param id 再生するaudio要素のID
 * @param t 遠征などの終了時刻
 * @param text ポップアップ等のテキスト通知用テキスト
 */
function PlayAudio( id, t, text ){
    let audio = document.getElementById( id );
    let time = parseInt( audio.getAttribute( 'kc-play-time' ) || 0 );
    if( t > time ){
        audio.play();
        audio.setAttribute( 'kc-play-time', t );

        if( KanColleTimerSidebar.config && KanColleTimerSidebar.config['notify-popup'] && text ){
            browser.notifications.create(
                id,
                {
                    "type": "basic",
                    "iconUrl": "http://pics.dmm.com/freegame/app/854854/200.jpg",
                    "title": "艦これタイマーX",
                    "message": text
                } );
        }
    }
}


let KanColleTimerSidebar = {

    /**
     * 遠征タイマーをセットする
     * @param deck
     */
    setMissionTimer: async function( deck ){
        if( !deck ) return;
        this.deck = deck;

        let fleetname = $( '.mission-fleet-name' );
        let missionname = $( '.mission-name' );
        let datetime = $( '.mission-finish-time' );
        let remain = $( '.mission-remain' );
        remain.removeClass( 'last-1min' );

        let missions = [];
        for( let i = 0; i < 4; i++ ){
            missions.push( deck[i].api_mission[1] );
            if( i == 0 ){
                $( '#1st-fleet-name' ).text( deck[i].api_name );
            }

            fleetname[i].textContent = deck[i].api_name;
            let t = parseInt( deck[i].api_mission[2] );
            datetime[i].textContent = t > 0 ? GetDateString( t ) : '---';

            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            remain[i].textContent = `(${t > 0 ? GetTimeString( t - now ) : '---'})`;
            if( t > 0 ){
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                }
            }
        }

        let name = await GetMissionName( missions );
        if( !name ) return;
        for( let i = 0; i < 4; i++ ){
            if( name[i] ){
                missionname[i].textContent = name[i];
            }
        }

        for( let i = 0, fleet; fleet = deck[i]; i++ ){
            let ship_ids = [];
            for( let j = 0, ship_id; ship_id = fleet.api_ship[j]; j++ ){
                if( ship_id !== -1 ){
                    ship_ids.push( ship_id );
                }
            }
            // TODO データ取得まわりを1ヶ所にまとめて効率良くしたい
            let specs = await GetShipSpecs( ship_ids );

            $( missionname[i] ).attr( 'icon', '' );
            for( let spec of specs ){
                if( !spec ) continue;

                if( spec._mst_data.api_fuel_max != spec.api_fuel ||
                    spec._mst_data.api_bull_max != spec.api_bull ){
                    $( missionname[i] ).attr( 'icon', 'warning' );
                }

                if( this.isRepairing( spec.api_id ) ){
                    $( missionname[i] ).attr( 'icon', 'repair' );
                }
            }
        }
    },

    setRepairTimer: async function( ndock ){
        if( !ndock ) return;
        this.ndock = ndock;

        let shipname = $( '.repair-ship-name' );
        let datetime = $( '.repair-finish-time' );
        let remain = $( '.repair-remain' );

        let ship_ids = [];
        for( let i = 0; i < 4; i++ ){
            ship_ids.push( ndock[i].api_ship_id );

            let t = ndock[i].api_complete_time;
            datetime[i].textContent = t > 0 ? GetDateString( t ) : '---';

            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            remain[i].textContent = `(${t > 0 ? GetTimeString( t - now ) : '---'})`;
        }

        let name = await GetShipName( ship_ids );
        if( !name ) return;

        for( let i = 0; i < 4; i++ ){
            shipname[i].textContent = `${name[i] ? name[i] : 'No.' + (i + 1)}`;
        }
    },

    setBuildTimer: async function( kdock ){
        if( !kdock ) return;
        this.kdock = kdock;

        let shipname = $( '.build-ship-name' );
        let datetime = $( '.build-finish-time' );
        let remain = $( '.build-remain' );

        let ship_ids = [];
        for( let i = 0; i < 4; i++ ){
            ship_ids.push( kdock[i].api_created_ship_id );

            let t = kdock[i].api_complete_time;
            datetime[i].textContent = t > 0 ? GetDateString( t ) : '---';

            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            remain[i].textContent = `(${t > 0 ? GetTimeString( t - now ) : '---'})`;
        }

        let name = await GetShipNameFromId( ship_ids );
        if( !name ) return;

        for( let i = 0; i < 4; i++ ){
            shipname[i].textContent = `${name[i] ? name[i] : 'No.' + (i + 1)}`;
        }
    },

    updateMissionTimer: function(){
        if( !this.deck ) return;
        let remain = $( '.mission-remain' );
        for( let i = 0; i < 4; i++ ){
            let t = parseInt( this.deck[i].api_mission[2] );
            let now = parseInt( (new Date()).getTime() / 1000 );
            t = parseInt( t / 1000 );
            if( t > 0 ){
                // 遠征に出ている
                remain[i].textContent = `(${t > now ? GetTimeString( t - now ) : '00:00:00'})`;
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                    PlayAudio( 'snd-mission-finish-soon', t, `まもなく第${i + 1}艦隊が遠征から帰投します` );
                }
                if( t <= now ){
                    PlayAudio( 'snd-mission-finished', t, `第${i + 1}艦隊が遠征から帰還しました` );
                }
            }else{
                // 遠征に出ていない
                remain[i].textContent = '(---)';
                $( remain[i] ).removeClass( 'last-1min' );
            }
        }
    },

    updateRepairTimer: function(){
        if( !this.ndock ) return;
        let remain = $( '.repair-remain' );

        for( let i = 0; i < 4; i++ ){
            let t = this.ndock[i].api_complete_time;
            let now = parseInt( (new Date()).getTime() / 1000 );
            t = parseInt( t / 1000 );
            if( t > 0 ){
                remain[i].textContent = `(${t > now ? GetTimeString( t - now ) : '00:00:00'})`;
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                    PlayAudio( 'snd-repair-finish-soon', t, `まもなく艦艇の修理が完了します` );
                }
                if( t <= now ){
                    PlayAudio( 'snd-repair-finished', t, `艦艇の修理が完了しました` );
                }
            }else{
                remain[i].textContent = '(---)';
                $( remain[i] ).removeClass( 'last-1min' );
            }
        }
    },

    updateBuildTimer: function(){
        if( !this.kdock ) return;
        let remain = $( '.build-remain' );

        for( let i = 0; i < 4; i++ ){
            let t = this.kdock[i].api_complete_time;
            let now = parseInt( (new Date()).getTime() / 1000 );
            t = parseInt( t / 1000 );
            if( t > 0 ){
                remain[i].textContent = `(${t > now ? GetTimeString( t - now ) : '00:00:00'})`;
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                    PlayAudio( 'snd-build-finish-soon', t, `まもなく艦艇の建造が完了します` );
                }
                if( t <= now ){
                    PlayAudio( 'snd-build-finished', t, `艦艇の建造が完了しました` );
                }
            }else{
                remain[i].textContent = '(---)';
                $( remain[i] ).removeClass( 'last-1min' );
            }
        }
    },

    /**
     * 第1艦隊のコンディション回復タイマーをカウントダウンする.
     */
    updateRefreshTimer: function(){
        let refresh_timer = $( '#refresh-timer' );
        let t = refresh_timer.attr( 'refresh-time' );
        let now = GetCurrentTime();
        if( t && t > now ){
            refresh_timer.text( GetTimeString( t - now ).substring( 3 ) );
        }else{
            refresh_timer.attr( 'refresh-time', '' );
            refresh_timer.text( "00:00" );
        }
    },

    /**
     * 1秒ごとにすべてのタイマーをカウントダウンする
     */
    updateTimers: function(){
        this.updateMissionTimer();
        this.updateRepairTimer();
        this.updateBuildTimer();
        this.updateRefreshTimer();

        if( (GetCurrentTime() % 300) == 0 ){
            // 定期的に任務リストを更新すると締め切り過ぎたものの色が変わってくれる
            this.updateQuestList( this.questlist );
        }
    },

    /**
     * 入渠中であればtrueを返す.
     * @param ship_id
     * @returns {boolean}
     */
    isRepairing: function( ship_id ){
        for( let n of this.ndock ){
            if( n.api_ship_id == ship_id ) return true;
        }
        return false;
    },

    /**
     * 艦隊表示を更新する.
     * @param deck
     * @returns {Promise.<void>}
     */
    updateFleet: async function( deck ){
        let tbl_fleet = ["", "tbl-fleet-1st", "tbl-fleet-2nd", "tbl-fleet-3rd", "tbl-fleet-4th"];

        for( let i = 0, fleet; fleet = deck[i]; i++ ){
            let ship_ids = [];
            for( let j = 0, ship_id; ship_id = fleet.api_ship[j]; j++ ){
                if( ship_id !== -1 ){
                    ship_ids.push( ship_id );
                }
            }
            let specs = await GetShipSpecs( ship_ids );

            let tbl_id = tbl_fleet[fleet.api_id];
            let tbl_elem = document.getElementById( tbl_id );
            RemoveChildren( tbl_elem );

            let min_cond = 100;
            for( let spec of specs ){
                if( !spec ) continue;
                let t = document.querySelector( '#template-ship' );
                let clone2 = document.importNode( t.content, true );
                let elem = clone2.firstElementChild;

                let stype = elem.querySelector( '.ship-type' );
                let sname = elem.querySelector( '.ship-name' );
                let shp = elem.querySelector( '.ship-hp' );
                let scond = elem.querySelector( '.ship-cond' );
                let status = elem.querySelector( '.ship-status' );

                stype.textContent = spec._stype_name;
                sname.textContent = spec._name;
                shp.textContent = `${spec.api_nowhp}/${spec.api_maxhp}`;
                scond.textContent = spec.api_cond;

                /* デコレーション */
                if( spec.api_cond <= 19 ){
                    scond.setAttribute( 'cond', 'very-low' );
                }else if( spec.api_cond <= 29 ){
                    scond.setAttribute( 'cond', 'low' );
                }else if( spec.api_cond >= 50 ){
                    scond.setAttribute( 'cond', 'high' );
                }

                let ratio = spec.api_nowhp / spec.api_maxhp;
                if( fleet.api_id == 1 ){
                    // 第1艦隊のみ
                    let percentage = ratio * 100;
                    let image;
                    if( spec.api_nowhp == spec.api_maxhp ){
                        image = "../img/greenbar.png";
                    }else if( percentage <= 25 ){
                        image = "../img/redbar.png";
                    }else if( percentage <= 50 ){
                        image = "../img/orangebar.png";
                    }else if( percentage <= 75 ){
                        image = "../img/yellowbar.png";
                    }else{
                        image = "../img/lightgreenbar.png";
                    }
                    let style = `background-image: url("${image}"); background-position:left bottom; background-repeat:no-repeat; background-size: ${percentage}% 4px;`;
                    elem.setAttribute( 'style', style );

                    min_cond = spec.api_cond < min_cond ? spec.api_cond : min_cond;
                }
                if( ratio <= 0 ){
                    $( status ).attr( 'icon', 'destroyed' );
                }else if( ratio <= 0.25 ){
                    $( status ).attr( 'icon', 'large-damage' );
                    $( elem ).addClass( 'large-damage' );
                }else if( ratio <= 0.5 ){
                    $( status ).attr( 'icon', 'medium-damage' );
                }else if( ratio <= 0.75 ){
                    $( status ).attr( 'icon', 'small-damage' );
                }

                if( spec._mst_data.api_fuel_max != spec.api_fuel ||
                    spec._mst_data.api_bull_max != spec.api_bull ){
                    $( status ).attr( 'icon', 'warning' );
                }

                if( this.isRepairing( spec.api_id ) ){
                    $( status ).attr( 'icon', 'repair' );
                }

                /* 装備品表示 */
                let slotitem = `${spec._stype_name} ${spec._name} Lv${spec.api_lv}\n`;
                for( let item of spec.api_slot ){
                    if( item < 0 ) continue;
                    let it = this.slotitem[item];
                    slotitem += `■ ${it._mst_data.api_name}${it.api_level > 0 ? '★+' + it.api_level : ''}\n`;
                }
                if( spec.api_slot_ex > 0 ){
                    let it = this.slotitem[spec.api_slot_ex];
                    slotitem += `■ ${it._mst_data.api_name}${it.api_level > 0 ? '★+' + it.api_level : ''}\n`;
                }
                elem.title = slotitem;

                tbl_elem.appendChild( elem );
            }

            if( fleet.api_id == 1 ){
                // 第1艦隊のコンディション回復タイマー設定
                let refresh_timer = $( '#refresh-timer' );
                if( min_cond < 49 ){
                    let now = GetCurrentTime();
                    let t0 = (49 - min_cond);
                    if( t0 % 3 ){
                        t0 += 3 - (t0 % 3); // 3HP/3分 で回復なので、3の倍数まで切り上げ
                    }
                    t0 *= 60;
                    let refresh_time = t0 - (now % 180);
                    refresh_timer.attr( 'refresh-time', now + refresh_time );
                    refresh_timer.text( GetTimeString( refresh_time ).substring( 3 ) );
                }else{
                    refresh_timer.attr( 'refresh-time', '' );
                    refresh_timer.text( "00:00" );
                }
            }

        }
    },

    /**
     * 資源の更新
     * @param material
     */
    updateMaterial: function( material ){
        for( let m of material ){
            switch( m.api_id ){
            case 6:
                // 高速修復材
                $( '#repair-kit-num' ).text( m.api_value );
                break;

            default:
                break;
            }
        }
    },

    /**
     * コンディション一覧の更新
     * @param deck
     */
    updateCondition: async function( deck ){
        let tbl_fleet = ["", "1st-fleet-cond", "2nd-fleet-cond", "3rd-fleet-cond", "4th-fleet-cond"];

        for( let i = 0, fleet; fleet = deck[i]; i++ ){
            let ship_ids = [];
            for( let j = 0, ship_id; ship_id = fleet.api_ship[j]; j++ ){
                if( ship_id !== -1 ){
                    ship_ids.push( ship_id );
                }
            }
            let specs = await GetShipSpecs( ship_ids );

            let tbl_id = tbl_fleet[fleet.api_id];
            let tbl_elem = document.getElementById( tbl_id );
            RemoveChildren( tbl_elem );

            for( let spec of specs ){
                if( !spec ) continue;
                let scond = document.createElement( 'label' );
                scond.appendChild( document.createTextNode( spec.api_cond ) );
                scond.setAttribute( 'style', 'margin-left:1em;' );

                /* デコレーション */
                if( spec.api_cond <= 19 ){
                    scond.setAttribute( 'cond', 'very-low' );
                }else if( spec.api_cond <= 29 ){
                    scond.setAttribute( 'cond', 'low' );
                }else if( spec.api_cond >= 50 ){
                    scond.setAttribute( 'cond', 'high' );
                }

                tbl_elem.appendChild( scond );
            }
        }
    },

    /**
     * 被害艦娘一覧の更新
     */
    updateDamagedShips: async function(){
        let damaged = await GetAllDamagedShipSpecs();
        let table = $( '#damaged-ships-table' );
        table.empty();

        damaged.sort( ( a, b ) =>{
            return b.api_ndock_time - a.api_ndock_time;
        } );

        $( '#num-damaged-ships' ).text( `(${damaged.length})` );

        damaged.forEach( ( ship ) =>{
            let t = document.querySelector( '#template-damaged-ship' );
            let clone2 = document.importNode( t.content, true );
            let elem = clone2.firstElementChild;

            let stype = elem.querySelector( '.ship-type' );
            let sname = elem.querySelector( '.ship-name' );
            let srepairtime = elem.querySelector( '.ship-repairtime' );

            $( stype ).text( ship._stype_name );
            $( sname ).text( ship._name );
            $( srepairtime ).text( GetTimeString( ship.api_ndock_time / 1000 ) );

            let ratio = ship.api_nowhp / ship.api_maxhp;
            if( ratio <= 0 ){
                $( srepairtime ).attr( 'icon', 'destroyed' );
            }else if( ratio <= 0.25 ){
                $( srepairtime ).attr( 'icon', 'large-damage' );
                $( srepairtime ).addClass( 'large-damage' );
            }else if( ratio <= 0.5 ){
                $( srepairtime ).attr( 'icon', 'medium-damage' );
                $( srepairtime ).addClass( 'medium-damage' );
            }else if( ratio <= 0.75 ){
                $( srepairtime ).attr( 'icon', 'small-damage' );
                $( srepairtime ).addClass( 'small-damage' );
            }
            if( this.isRepairing( ship.api_id ) ){
                $( srepairtime ).attr( 'icon', 'repair' );
            }

            table.append( elem );
        } );
    },

    /**
     * 任務一覧の表示
     * @param quests
     */
    updateQuestList: function( quests ){
        this.questlist = quests;

        let list = Object.keys( quests ).map( ( k ) =>{
            return quests[k];
        } ).sort( ( a, b ) =>{
            return a.api_no - b.api_no;
        } );

        let tbl = $( '#tbl-questlist' );
        tbl.empty();

        let category_color = {
            0: "",
            1: "#41c161", // 編成
            2: "#df4f42", // 出撃
            3: "#7ebb56", // 演習
            4: "#45b9c3", // 遠征
            5: "#cab057", // 補給・入渠
            6: "#7d4f33", // 工廠
            7: "#b599c9", // 改装
            8: "#df4f42", // 出撃
        };

        for( let q of list ){
            if( q.api_state == 2 ){
                let t = document.querySelector( '#template-quest' );
                let clone2 = document.importNode( t.content, true );
                let elem = clone2.firstElementChild;
                let questname = elem.querySelector( '.quest-name' );
                let questtype = elem.querySelector( '.quest-type' );

                let str = 'padding-left: 0.3em; border-left: 5px solid ' + category_color[q.api_category];
                $( questname ).attr( 'style', str );
                $( questname ).text( q.api_title );

                let type = ['', '日', '週', '月', '単', '他'];
                if( q.api_type <= type.length ){
                    $( questtype ).text( `[${type[q.api_type]}]` );
                }else{
                    $( questtype ).text( `[${q.api_type}]` );
                }

                if( q.api_type == 1 || q.api_type == 2 || q.api_type == 3 ){
                    // 日週月の任務は締め切り時刻のチェックをする
                    let now = (new Date()).getTime();
                    if( now > q._deadline ){
                        $( elem ).addClass( 'old-quest' );
                    }
                }

                switch( q.api_progress_flag ){
                case 1:// 50%
                    str = '50%';
                    $( questtype ).attr( 'style', `background-color: #88ff88;` );
                    break;
                case 2:// 80%
                    str = '80%';
                    $( questtype ).attr( 'style', `background-color: #3cb371;` );
                    break;
                default:
                    str = '0%';
                    break;
                }

                let deadline = q._deadline ? `${new Date( q._deadline ).toLocaleString()}` : '';

                elem.title = `進捗:${str} ${deadline}まで\n${q.api_detail.replace( '<br>', '' )}`;

                tbl.append( elem );
            }
        }
    },

    /**
     * 表示項目の表示順序を保存
     */
    savePanelOrder: function(){
        let fieldset = $( 'fieldset' );
        let order = [];
        for( let i = 0, f; f = fieldset[i]; i++ ){
            order.push( f.id );
        }

        browser.storage.local.set( {
            'panel_order': order
        } );
    },

    /**
     * 表示物の表示順序を設定
     * @param order
     */
    setPanelOrder: function( order ){
        if( !order ) return;

        let panels = document.querySelectorAll( '.panel' );

        for( let i = 0, id; id = order[i]; i++ ){
            let f = document.querySelector( `#${id}` );
            panels[i].appendChild( f );
        }
    },

    loadSettings: function( config ){
        if( !config ) return;
        this.config = config;

        $( '#snd-mission-finished' ).attr( 'src', config['snd-mission-finished'] );
        $( '#snd-mission-finish-soon' ).attr( 'src', config['snd-mission-finish-soon'] );
        $( '#snd-repair-finished' ).attr( 'src', config['snd-repair-finished'] );
        $( '#snd-repair-finish-soon' ).attr( 'src', config['snd-repair-finish-soon'] );
        $( '#snd-build-finished' ).attr( 'src', config['snd-build-finished'] );
        $( '#snd-build-finish-soon' ).attr( 'src', config['snd-build-finish-soon'] );


        let pt = config['font-size'] || 9;
        document.body.style.fontSize = `${pt}pt`;
    },

    createPiePath: function( radius, percentage ){
        let degree = 360 * (percentage / 100);
        let path = d3.path();
        path.moveTo( radius, radius );
        path.arc( radius, radius, radius, 0, Deg2Rad( degree ), 1 );
        return path;
    },

    test: function(){
        return;

        let percentage = 22;
        let degree = 360 * (percentage / 100);
        let svg = d3.select( 'svg' );
        let radius = 20;

        let path = this.createPiePath( 20, 22 );

        svg.append( 'path' )
            .attr( 'transform', `rotate(-90, ${radius},${radius})` )
            .attr( "d", path.toString() );
    },

    init: async function(){
        this.test();

        setInterval( () =>{
            this.updateTimers();
        }, 1000 );

        $( '#select-fleet-234' ).change( () =>{
            let n = $( '#select-fleet-234' ).val();
            let tbl = $( '#fleet-234 table' );
            for( let i = 0; i < 3; i++ ){
                if( n - 2 == i ){
                    $( tbl[i] ).show();
                    $( '#select-fleet-234 option' )[i].setAttribute( 'selected', 'true' );
                }else{
                    $( tbl[i] ).hide();
                    $( '#select-fleet-234 option' )[i].removeAttribute( 'selected' );
                }
            }
        } );

        // ウィンドウ位置サイズを復元
        let win = await browser.windows.getCurrent();
        this._win = win;
        if( win.title.match( /^moz-extension.*艦これタイマーX$/ ) && win.type != 'normal' ){
            let pos = localStorage.getItem( 'kct_window_position' );
            console.log( pos );
            if( pos ){
                pos = JSON.parse( pos );
                browser.windows.update( win.id, {
                    left: pos.x,
                    top: pos.y,
                    width: pos.w,
                    height: pos.h
                } )
            }
        }

        // 保存しているデータをロード
        let result;
        result = await browser.storage.local.get( 'slotitem' );
        if( result ){
            this.slotitem = result.slotitem;
        }

        result = await browser.storage.local.get( 'deck' );
        if( result ){
            this.setMissionTimer( result.deck );
            this.updateFleet( result.deck );
            this.updateCondition( result.deck );
            this.updateDamagedShips();
        }
        result = await browser.storage.local.get( 'ndock' );
        if( result ){
            this.setRepairTimer( result.ndock );
        }
        result = await browser.storage.local.get( 'kdock' );
        if( result ){
            this.setBuildTimer( result.kdock );
        }

        result = await browser.storage.local.get( 'kct_config' );
        if( result ){
            this.loadSettings( result.kct_config );
        }

        result = await browser.storage.local.get( 'panel_order' );
        if( result ){
            this.setPanelOrder( result.panel_order );
        }

        browser.storage.onChanged.addListener( ( changes, area ) =>{
            console.log( changes );
            if( changes.deck ){
                this.setMissionTimer( changes.deck.newValue );
                this.updateFleet( changes.deck.newValue );
                this.updateCondition( changes.deck.newValue );
                this.updateDamagedShips();
            }
            if( changes.ndock ){
                this.setRepairTimer( changes.ndock.newValue );
            }
            if( changes.kdock ){
                this.setBuildTimer( changes.kdock.newValue );
            }

            if( changes.material ){
                this.updateMaterial( changes.material.newValue );
            }

            if( changes.slotitem ){
                this.slotitem = changes.slotitem.newValue;
            }
            if( changes.kct_config ){
                this.loadSettings( changes.kct_config.newValue );
            }

            if( changes.questlist ){
                this.updateQuestList( changes.questlist.newValue );
            }
        } );

        // this.initDragAndDrop();

        Sortable.create( document.querySelector( '#main' ), {
            onEnd: ( ev ) =>{
                this.savePanelOrder();
            }
        } );

        console.log( 'kancolle timer x sidebar initialized.' );

    },

    unload: function( ev ){
        if( this._win.title.match( /^moz-extension.*艦これタイマーX$/ ) && this._win.type != 'normal' ){
            let x = window.screenX;
            let y = window.screenY;
            let w = window.outerWidth;
            let h = window.outerHeight;

            let window_position = {
                x: x,
                y: y,
                w: w,
                h: h
            };
            localStorage.setItem( 'kct_window_position', JSON.stringify( window_position ) );
        }
    }
};


window.addEventListener( 'load', ( ev ) =>{
    KanColleTimerSidebar.init();
} );

window.addEventListener( 'unload', ( ev ) =>{
    KanColleTimerSidebar.unload( ev );
} );
