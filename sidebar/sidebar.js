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

        if( KanColleTimerSidebar.config['notify-popup'] && text ){
            browser.notifications.create( {
                "type": "basic",
                "iconUrl": "http://pics.dmm.com/freegame/app/854854/200.jpg",
                "title": "艦これタイマーX",
                "message": text
            } );
        }
    }
}


/**
 * 指定の遠征の名前を返す
 * @param mission_ids{Array}
 * @returns {Promise.<*>}
 */
async function GetMissionName( mission_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-mission-name',
        missions: mission_ids
    } );
    return result;
}

async function GetShipName( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-name',
        ids: ship_ids
    } );
    return result;
}

async function GetShipNameFromId( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-name-from-id',
        ids: ship_ids
    } );
    return result;
}

async function GetShipSpecs( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-specs',
        ids: ship_ids
    } );
    return result;
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
     * 1秒ごとにカウントダウンする
     */
    updateTimers: function(){
        this.updateMissionTimer();
        this.updateRepairTimer();
        this.updateBuildTimer();
    },

    isRepairing: function( ship_id ){
        for( let n of this.ndock ){
            if( n.api_ship_id == ship_id ) return true;
        }
        return false;
    },

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
            for( let spec of specs ){
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

                tbl_elem.appendChild( elem );
            }
        }
    },

    loadSettings: function( config ){
        this.config = config;

        $( '#snd-mission-finished' ).attr( 'src', config['snd-mission-finished'] );
        $( '#snd-mission-finish-soon' ).attr( 'src', config['snd-mission-finish-soon'] );
        $( '#snd-repair-finished' ).attr( 'src', config['snd-repair-finished'] );
        $( '#snd-repair-finish-soon' ).attr( 'src', config['snd-repair-finish-soon'] );
        $( '#snd-build-finished' ).attr( 'src', config['snd-build-finished'] );
        $( '#snd-build-finish-soon' ).attr( 'src', config['snd-build-finish-soon'] );
    },

    init: async function(){
        setInterval( () =>{
            this.updateTimers();
        }, 1000 );

        $( '#select-fleet-234' ).change( () =>{
            let n = $( '#select-fleet-234' ).val();
            let tbl = $( '#fleet-234 table' );
            for( let i = 0; i < 3; i++ ){
                if( n - 2 == i ){
                    $( tbl[i] ).show();
                }else{
                    $( tbl[i] ).hide();
                }
            }
        } );

        // 保存しているデータをロード
        let result = await browser.storage.local.get( 'deck' );
        if( result ){
            KanColleTimerSidebar.setMissionTimer( result.deck );
        }
        result = await browser.storage.local.get( 'ndock' );
        if( result ){
            KanColleTimerSidebar.setRepairTimer( result.ndock );
        }
        result = await browser.storage.local.get( 'kdock' );
        if( result ){
            KanColleTimerSidebar.setBuildTimer( result.kdock );
        }

        result = await browser.storage.local.get( 'kct_config' );
        if( result ){
            KanColleTimerSidebar.loadSettings( result.kct_config );
        }


        browser.storage.onChanged.addListener( ( changes, area ) =>{
            console.log( changes );
            if( changes.deck ){
                KanColleTimerSidebar.setMissionTimer( changes.deck.newValue );
                KanColleTimerSidebar.updateFleet( changes.deck.newValue );
            }
            if( changes.ndock ){
                KanColleTimerSidebar.setRepairTimer( changes.ndock.newValue );
            }
            if( changes.kdock ){
                KanColleTimerSidebar.setBuildTimer( changes.kdock.newValue );
            }

            if( changes.kct_config ){
                KanColleTimerSidebar.loadSettings( changes.kct_config.newValue );
            }
        } );

        result = await browser.storage.local.get( 'test' );
        console.log( 'kancolle timer x sidebar initialized.' );
    }
};


window.addEventListener( 'load', ( ev ) =>{
    KanColleTimerSidebar.init();
} );
