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


/**
 * 指定の遠征の名前を返す
 * @param mission_ids{Array}
 * @returns {Promise.<*>}
 * @constructor
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


let KanColleTimerSidebar = {
    deck: null,

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

            fleetname[i].innerHTML = deck[i].api_name;
            let t = parseInt( deck[i].api_mission[2] );
            datetime[i].innerHTML = t > 0 ? GetDateString( t ) : '---';

            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            remain[i].innerHTML = `(${t > 0 ? GetTimeString( t - now ) : '---'})`;
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
                missionname[i].innerHTML = name[i];
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
            datetime[i].innerHTML = t > 0 ? GetDateString( t ) : '---';

            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            remain[i].innerHTML = `(${t > 0 ? GetTimeString( t - now ) : '---'})`;
        }

        let name = await GetShipName( ship_ids );
        if( !name ) return;

        for( let i = 0; i < 4; i++ ){
            shipname[i].innerHTML = `${name[i] ? name[i] : 'No.' + (i + 1)}`;
        }
    },

    updateMissionTimer: function(){
        if( !this.deck ) return;
        let remain = $( '.mission-remain' );
        for( let i = 0; i < 4; i++ ){
            let t = parseInt( this.deck[i].api_mission[2] );
            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            if( t > 0 ){
                remain[i].innerHTML = `(${t > now ? GetTimeString( t - now ) : '00:00:00'})`;
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                }
            }else{
                remain[i].innerHTML = '(---)';
                $( remain[i] ).removeClass( 'last-1min' );
            }
        }
    },

    updateRepairTimer: function(){
        if( !this.ndock ) return;
        let remain = $( '.repair-remain' );

        for( let i = 0; i < 4; i++ ){
            let t = this.ndock[i].api_complete_time;
            let now = (new Date()).getTime() / 1000;
            t /= 1000;
            if( t > 0 ){
                remain[i].innerHTML = `(${t > now ? GetTimeString( t - now ) : '00:00:00'})`;
                if( t - now <= 60 ){
                    $( remain[i] ).addClass( 'last-1min' );
                }
            }else{
                remain[i].innerHTML = '(---)';
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
    },

    init: async function(){
        setInterval( () =>{
            this.updateTimers();
        }, 1000 );

        let result = await browser.storage.local.get( 'deck' );
        if( result ){
            KanColleTimerSidebar.setMissionTimer( result.deck );
        }
        result = await browser.storage.local.get( 'ndock' );
        if( result ){
            KanColleTimerSidebar.setRepairTimer( result.ndock );
        }

        browser.storage.onChanged.addListener( ( changes, area ) =>{
            console.log( changes );
            if( changes.deck ){
                KanColleTimerSidebar.setMissionTimer( changes.deck.newValue );
            }
            if( changes.ndock ){
                KanColleTimerSidebar.setRepairTimer( changes.ndock.newValue );
            }
        } );
    }
};


window.addEventListener( 'load', ( ev ) =>{
    KanColleTimerSidebar.init();
} );
