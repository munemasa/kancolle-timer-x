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
console.log( 'load kancolle timer x background script.' );

let KanColle = {
    resourcelog: [],
    droplog: [],
    questlist: {},
    action_report: {},

    /**
     * 指定の艦隊番号(1-4)の艦隊を返す.
     * @param fleet_no
     * @returns {*}
     */
    getDeck: function( fleet_no ){
        for( let fleet of this.deck ){
            if( fleet.api_id == fleet_no ){
                return fleet;
            }
        }
        return null;
    }
};

function GetKanColle(){
    return KanColle;
}


function SaveResourceData(){
    // 資源グラフを保存
    KanColle.resourcelog.forEach( ( e ) =>{
        // 資源グラフで設定した値がDead objectになるので削除する
        delete e.date;
    } );
    let month_ago = GetCurrentTime() - 60 * 60 * 24 * 31;
    month_ago = parseInt( month_ago / 60 );
    let data = KanColle.resourcelog.filter(
        function( elem, index, array ){
            return elem.record_time > month_ago;
        } );
    localStorage.setItem( 'kct_resource', JSON.stringify( data ) );
}

/**
 * 獲得順に割り当てられる保有艦のIDから艦名を取得する.
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetShipName( request, sender, sendResponse ){
    let result = request.ids.map( ( id ) =>{
        try{
            if( id == 0 ) return '';
            return KanColle._api_mst_ship[KanColle._api_ship[id].api_ship_id].api_name;
        }catch( e ){
            return "[Unknown]";
        }
    } );
    sendResponse( result );
}

/**
 * 艦船固有のIDから艦名を取得する.
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetShipNameFromId( request, sender, sendResponse ){
    let result = request.ids.map( ( id ) =>{
        try{
            if( id == 0 ) return '';
            return KanColle._api_mst_ship[id].api_name;
        }catch( e ){
            return "[Unknown]";
        }
    } );
    sendResponse( result );
}

/**
 * 艦艇のスペックを取得する.
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetShipSpecs( request, sender, sendResponse ){
    let result = request.ids.map( ( id ) =>{
        try{
            return KanColle._api_ship[id];
        }catch( e ){
            return null;
        }
    } );
    sendResponse( result );
}


/**
 * 全艦艇のスペックを取得する.
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetAllShipSpecs( request, sender, sendResponse ){
    sendResponse( KanColle._api_ship );
}

/**
 * 全損傷艦艇のスペックを取得する.
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetAllDamagedShipSpecs( request, sender, sendResponse ){
    let damaged = Object.keys( KanColle._api_ship ).filter( ( id ) =>{
        return KanColle._api_ship[id].api_ndock_time > 0;
    } ).map( ( id ) =>{
        return KanColle._api_ship[id];
    } );
    sendResponse( damaged );
}


/**
 * 遠征名を取得する
 * @param request
 * @param sender
 * @param sendResponse
 */
function GetMissionName( request, sender, sendResponse ){
    let missions = request.missions;
    let result = missions.map( ( id ) =>{
        if( id == 0 ) return '';
        for( let v of KanColle.api_mst_mission ){
            if( v.api_id == id ) return v.api_name;
        }
        return '[Unknown]';
    } );
    sendResponse( result );
}

function SetGamePosition( request, sender, sendResponse ){
    KanColle._ss_game_position = request.value;
    sendResponse( true );
}

function SetFlashPosition( request, sender, sendResponse ){
    KanColle._ss_flash_position = request.value;
    sendResponse( true );
}

function GetScreenshotPosition( request, sender, sendResponse ){
    sendResponse( {
        game: KanColle._ss_game_position,
        flash: KanColle._ss_flash_position
    } );
}


function HandleMessage( request, sender, sendResponse ){
    switch( request.cmd ){
    case 'get-mission-name':
        // 遠征名を返す
        GetMissionName( request, sender, sendResponse );
        break;
    case 'get-ship-name':
        // 艦娘名を返す
        GetShipName( request, sender, sendResponse );
        break;
    case 'get-ship-name-from-id':
        // 艦船IDから艦娘名を返す
        GetShipNameFromId( request, sender, sendResponse );
        break;
    case 'get-ship-specs':
        // 指定の艦娘のスペックを返す
        GetShipSpecs( request, sender, sendResponse );
        break;
    case 'get-all-ship-specs':
        // 全艦娘のスペックを返す
        GetAllShipSpecs( request, sender, sendResponse );
        break;
    case 'get-all-damaged-ship-specs':
        // 損害艦艇のスペックを返す
        GetAllDamagedShipSpecs( request, sender, sendResponse );
        break;

        // 艦これの表示座標を定期的に送ってもらう
    case 'set-game-position':
        // 艦これのiframeのある位置
        SetGamePosition( request, sender, sendResponse );
        break;
    case 'set-flash-position':
        // iframe内で艦これのflashがある位置
        SetFlashPosition( request, sender, sendResponse );
        break;
    case 'get-screenshot-position':
        GetScreenshotPosition( request, sender, sendResponse );
        break;
    }
}

browser.runtime.onMessage.addListener( HandleMessage );


function SetLocalStorage( k, v ){
    let obj = {};
    obj[k] = v;
    browser.storage.local.set( obj ).then( ( result ) =>{
    }, ( error ) =>{
        console.log( error );
    } );
}


async function LoadMasterData(){
    let result = await browser.storage.local.get( 'mst_data' );
    if( result && result.mst_data ){
        UpdateMasterData( result.mst_data );
    }

    result = await browser.storage.local.get( 'deck' );
    if( result ){
        KanColle.deck = result.deck;
    }
}

/**
 * マスターデータ更新
 * @param api_data{Object}
 */
function UpdateMasterData( api_data ){
    for( let k in api_data ){
        KanColle[k] = api_data[k];
    }

    let stype = {};
    for( let t of KanColle.api_mst_stype ){
        stype[t.api_id] = t;
    }
    KanColle._api_mst_stype = stype;

    let shipdata = {};
    for( let ship of KanColle.api_mst_ship ){
        shipdata[ship.api_id] = ship;
    }
    KanColle._api_mst_ship = shipdata;

    let slotitem = {};
    for( let item of KanColle.api_mst_slotitem ){
        slotitem[item.api_id] = item;
    }
    KanColle._api_mst_slotitem = slotitem;

    SetLocalStorage( 'mst_data', api_data );
}

/**
 * 艦隊編成の更新をする
 * @param data
 */
function UpdateDeck( data ){
    // TODO 連合艦隊でも問題ないか未確認
    for( let i in KanColle.deck ){
        for( let deck of data.api_deck_data ){
            if( KanColle.deck[i].api_id == deck.api_id ){
                KanColle.deck[i] = deck;
            }
        }
    }
    SetLocalStorage( 'deck', KanColle.deck );
}

function UpdateMissionTimer( data ){
    KanColle.deck = data;
    SetLocalStorage( 'deck', KanColle.deck );
}

function UpdateRepairTimer( data ){
    KanColle.ndock = data;
    SetLocalStorage( 'ndock', KanColle.ndock );
}

function UpdateBuildTimer( data ){
    KanColle.kdock = data;
    SetLocalStorage( 'kdock', KanColle.kdock );
}

/**
 * 資源等の更新
 * @param material[Array]
 */
function UpdateMaterial( material ){
    KanColle.material = material;
    SetLocalStorage( 'material', KanColle.material );

    let last_data;
    last_data = KanColle.resourcelog[KanColle.resourcelog.length - 1] || {record_time: 0};

    let now = parseInt( GetCurrentTime() / 60 );
    let m = {};
    m.record_time = now;
    for( let value of material ){
        switch( value.api_id ){
        case 1: // 燃料
            m.fuel = value.api_value;
            break;
        case 2: // 弾薬
            m.bullet = value.api_value;
            break;
        case 3: // 鋼材
            m.steel = value.api_value;
            break;
        case 4: // ボーキサイト
            m.bauxite = value.api_value;
            break;
        case 6: // バケツ
            m.bucket = value.api_value;
            break;
        }
    }
    if( last_data.record_time != m.record_time &&
        (last_data.fuel != m.fuel ||
            last_data.bullet != m.bullet ||
            last_data.steel != m.steel ||
            last_data.bauxite != m.bauxite ||
            last_data.bucket != m.bucket) ){
        KanColle.resourcelog.push( m );

        SaveResourceData();
    }
}

/**
 * 所有艦艇のデータを更新する
 * @param api_ship
 */
function UpdateShipFull( api_ship ){
    let shipdata = {};
    for( let ship of api_ship ){
        ship._name = KanColle._api_mst_ship[ship.api_ship_id].api_name;
        ship._stype = KanColle._api_mst_ship[ship.api_ship_id].api_stype;
        ship._stype_name = KanColle._api_mst_stype[ship._stype].api_name;
        ship._mst_data = KanColle._api_mst_ship[ship.api_ship_id];
        shipdata[ship.api_id] = ship;
    }
    KanColle._api_ship = shipdata;
}

function UpdateShipPartial( ships ){
    // TODO Full版と合わせて整理したい
    for( let s of ships ){
        s._name = KanColle._api_mst_ship[s.api_ship_id].api_name;
        s._stype = KanColle._api_mst_ship[s.api_ship_id].api_stype;
        s._stype_name = KanColle._api_mst_stype[s._stype].api_name;
        s._mst_data = KanColle._api_mst_ship[s.api_ship_id];
        KanColle._api_ship[s.api_id] = s;
    }
}

function UpdateSlotitem( slotitems ){
    let items = {};
    for( let s of slotitems ){
        s._mst_data = KanColle._api_mst_slotitem[s.api_slotitem_id];
        items[s.api_id] = s;
    }
    KanColle._api_slot_item = items;
    SetLocalStorage( 'slotitem', KanColle._api_slot_item );
}

async function UpdateBasic( basic ){
    try{
        let cur_ships = Object.keys( KanColle._api_ship ).length;
        let cur_items = Object.keys( KanColle._api_slot_item ).length;
        basic._cur_ships = cur_ships;
        basic._cur_slotitem = cur_items;
    }catch( e ){
        basic._cur_ships = 0;
        basic._cur_slotitem = 0;
    }
    SetLocalStorage( 'basic', basic );

    let rank = ["", "元帥", "大将", "中将", "少将",
        "大佐", "中佐", "新米中佐",
        "少佐", "中堅少佐", "新米少佐", "", "", "", ""];

    let rankstr = rank[basic.api_rank];
    browser.sidebarAction.setTitle( {
        title: `${basic.api_nickname}${rankstr}(${basic._cur_ships}/${basic.api_max_chara})`
    } );
}

function UpdateQuestList( data ){
    function deadline( t, weekly ){
        const base = 331200000;	// 1970/1/4 20:00 UTC = 1970/1/5(月) 5:00 JST
        const fuzz = 60000;
        const span = 86400000 * (weekly ? 7 : 1);
        let d;
        let elapsed;	// 期間開始からの経過時間

        if( !t || t < 0 )
            return -1;	// エラー

        elapsed = (t - base) % span;
        if( elapsed < fuzz )
            return 0;	// 時計ずれを考慮

        return t + span - elapsed;
    }

    let now = new Date();
    for( let q of data.api_list ){
        if( q == -1 ) continue;
        switch( q.api_type ){
        case 1: // デイリー
        case 2: // ウィークリー
            q._deadline = deadline( now.getTime(), q.api_type == 2 );
            break;

        case 3: // マンスリー
            let nextmonth;
            if( now.getDate() == 1 && now.getHours() < 5 ){
                // 1日5時までは先月の区分なので、今月1日5時までが締め切り
                nextmonth = new Date( now.getFullYear(), now.getMonth(), 1, 5, 0, 0 );
            }else{
                nextmonth = new Date( now.getFullYear(), now.getMonth() + 1, 1, 5, 0, 0 );
            }
            q._deadline = nextmonth.getTime();
        }

        KanColle.questlist[q.api_no] = q;
        if( q.state == 3 ){
            delete KanColle.questlist[q.api_no];
        }
    }

    SetLocalStorage( 'questlist', KanColle.questlist );
}


async function RecordDropShip( data ){
    if( !data.api_get_ship ) return;

    let result = await browser.storage.local.get( 'kct_config' );
    if( !result.kct_config['webhook-drop-create-ship'] ) return;

    // ドロップ艦娘記録 IFTTTのWebhookの仕様に合わせてデータ作成
    let url = result.kct_config['webhook-drop-create-ship'];
    let drop = {
        'value1': `${data.api_quest_name} ${data.api_enemy_info.api_deck_name}`,
        'value2': `${data.api_get_ship.api_ship_type} ${data.api_get_ship.api_ship_name}`,
        'value3': `${data.api_win_rank}`
    };

    let xhr = CreateXHR( 'POST', url );
    xhr.setRequestHeader( 'Content-type', 'application/json' );
    xhr.send( JSON.stringify( drop ) );
    xhr.onreadystatechange = function(){
        if( xhr.readyState == 4 ){
            console.log( `Webhook HTTP Status ${xhr.status}` );
        }
    };
}

function GunBattle( hougeki, myfleet, data ){
    if( !hougeki.api_at_eflag ) return; // 夜戦の潜水艦対潜水艦で砲雷撃戦がないとき
    for( let i = 0; i < hougeki.api_at_eflag.length; i++ ){
        let atk = hougeki.api_at_list[i]; // 攻撃する艦 index 0,1,2,...

        for( let j = 0; j < hougeki.api_df_list[i].length; j++ ){
            let def = hougeki.api_df_list[i][j];
            if( def < 0 ) continue;
            let damage = hougeki.api_damage[i][j];
            damage = parseInt( damage );
            if( hougeki.api_at_eflag[i] == 0 ){
                // 自軍→敵軍
                let ship = KanColle._api_mst_ship[data.api_ship_ke[def]];
                data.api_e_nowhps[def] -= damage;
                console.log( `#${j} ${KanColle._api_ship[myfleet.api_ship[atk]]._name} が ${ship.api_name} に ${damage} ダメージ` );
            }else{
                data.api_f_nowhps[def] -= damage;
                console.log( `#${j} ${KanColle._api_ship[myfleet.api_ship[def]]._name} に ${damage} ダメージ` );
            }
        }
    }
}

function TorpedoBattle( raigeki, myfleet, data ){
    // 自軍→敵軍
    if( raigeki.api_edam ){
        for( let i = 0; i < raigeki.api_edam.length; i++ ){
            let damage = raigeki.api_edam[i];
            if( damage > 0 ){
                damage = parseInt( damage );
                data.api_e_nowhps[i] -= damage;
                let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
                console.log( `#${i + 1} ${ship.api_name} に ${damage} ダメージ` );
            }
        }
    }
    // 敵軍→自軍
    if( raigeki.api_fdam ){
        for( let i = 0; i < raigeki.api_fdam.length; i++ ){
            let damage = raigeki.api_fdam[i];
            if( damage > 0 ){
                damage = parseInt( damage );
                data.api_f_nowhps[i] -= damage;
                console.log( `#${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} に ${damage} ダメージ` );
            }
        }
    }
}

/**
 * 戦闘結果を表示する.
 * @param myfleet 戦闘した艦隊(デッキ)の艦娘リスト
 * @param data 戦闘データ
 */
function DispBattleResult( myfleet, data ){
    let result = {
        fleet_no: data.api_deck_id,
        friend: [],
        enemy: []
    };
    console.log( '自軍' );
    for( let i = 0; i < data.api_f_nowhps.length; i++ ){
        let nowhp = data.api_f_nowhps[i];
        let maxhp = data.api_f_maxhps[i];
        let ratio = nowhp / maxhp;

        let percentage = ratio * 100;
        let dmg;
        if( nowhp == maxhp ){
            dmg = '';
        }else if( percentage <= 25 ){
            dmg = "大破";
        }else if( percentage <= 50 ){
            dmg = "中破";
        }else if( percentage <= 75 ){
            dmg = "小破";
        }else{
            dmg = "";
        }
        if( nowhp <= 0 ){
            dmg = '轟沈';
        }
        console.log( `#${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} HP ${nowhp}/${maxhp} (${dmg})` );
        result.friend.push( [KanColle._api_ship[myfleet.api_ship[i]]._name, nowhp, maxhp] );
    }
    console.log( '敵軍' );
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
        console.log( `#${i + 1} ${ship.api_name} HP ${data.api_e_nowhps[i] <= 0 ? '撃沈' : data.api_e_nowhps[i]}` );
        result.enemy.push( [ship.api_name, data.api_e_nowhps[i], data.api_e_maxhps[i]] );
    }

    KanColle.battle_report = result;
}

function NormalDaytimeBattle( data ){
    console.log( `第${data.api_deck_id}艦隊 昼戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    console.log( '敵軍艦隊HP' );
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
        console.log( `#${i + 1} ${ship.api_name}(Lv${data.api_ship_lv[i]}) ${data.api_e_nowhps[i]}/${data.api_e_maxhps[i]}` );
    }

    console.log( '自軍艦隊HP' );
    for( let i = 0; i < data.api_f_nowhps.length; i++ ){
        console.log( `#${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} ${data.api_f_nowhps[i]}/${data.api_f_maxhps[i]}` );
    }

    let form = ['', '単縦陣', '複縦陣', '輪形陣', '梯形陣', '単横陣', '警戒陣'];
    let form2 = ['', '同航戦', '反航戦', 'T字有利', 'T字不利'];
    console.log( `自軍 ${form[data.api_formation[0]]} 敵軍 ${form[data.api_formation[1]]}` );
    console.log( `${form2[data.api_formation[2]]}` );

    console.log( '*** 支援艦隊 ***' );
    if( data.api_support_info ){
        if( data.api_support_info.api_support_airatack ){
            let fleet_no = data.api_support_info.api_support_airatack.api_deck_id;
            console.log( `第${fleet_no}艦隊の支援攻撃` );
            let raigeki = data.api_support_info.api_support_airatack.api_stage3;
            let support_fleet = KanColle.getDeck( fleet_no );
            TorpedoBattle( raigeki, support_fleet, data );
        }
        if( data.api_support_info.api_support_hourai ){
            // TODO 支援の砲雷撃戦が他と共通点があれば独立
            let hourai = data.api_support_info.api_support_hourai;
            let fleet_no = hourai.api_deck_id;
            console.log( `第${fleet_no}艦隊の支援攻撃` );
            for( let i = 0; i < hourai.api_damage.length; i++ ){
                if( hourai.api_damage[i] > 0 ){
                    let damage = parseInt( hourai.api_damage[i] );
                    data.api_e_nowhps[i] -= damage;

                    let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
                    console.log( `${ship.api_name} に ${damage} ダメージ` );
                }
            }
        }
    }

    console.log( '*** 先制爆雷 ***' );
    if( data.api_opening_taisen ){
        // 砲撃戦と同じ処理
        GunBattle( data.api_opening_taisen, myfleet, data );
    }

    //--- 開幕戦
    console.log( '*** 先制雷撃戦 ***' );
    if( data.api_opening_atack ){
        TorpedoBattle( data.api_opening_atack, myfleet, data );
    }

    console.log( '*** 噴式強襲航空攻撃 ***' );
    if( data.api_injection_kouku && data.api_injection_kouku.api_stage3 ){
        TorpedoBattle( data.api_injection_kouku.api_stage3, myfleet, data );
    }

    console.log( '*** 航空戦 ***' );
    if( data.api_kouku ){
        if( data.api_kouku.api_stage1 ){
            let stage = data.api_kouku.api_stage1;
            console.log( `自機${stage.api_f_lostcount}機撃墜 敵機${stage.api_e_lostcount}機撃墜` );
        }
        if( data.api_kouku.api_stage2 ){
            let stage = data.api_kouku.api_stage2;
            console.log( `対空砲火により自機${stage.api_f_lostcount}機 敵機${stage.api_e_lostcount}機撃墜` );
        }
        if( data.api_kouku.api_stage3 ){
            // 艦艇へのダメージ処理はここだけ
            let raigeki = data.api_kouku.api_stage3;
            TorpedoBattle( raigeki, myfleet, data );
        }
    }

    //--- 砲撃戦1
    console.log( '*** 砲撃戦1 ***' );
    if( data.api_hougeki1 ){
        GunBattle( data.api_hougeki1, myfleet, data );
    }
    console.log( '*** 砲撃戦2 ***' );
    if( data.api_hougeki2 ){
        GunBattle( data.api_hougeki2, myfleet, data );
    }
    console.log( '*** 砲撃戦3 ***' );
    if( data.api_hougeki3 ){
        GunBattle( data.api_hougeki3, myfleet, data );
    }

    //--- 雷撃戦
    console.log( '*** 雷撃戦 ***' );
    if( data.api_raigeki ){
        TorpedoBattle( data.api_raigeki, myfleet, data );
    }

    //--- 結果
    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}

function NormalMidnightBattle( data ){
    console.log( `第${data.api_deck_id}艦隊 夜戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    console.log( '敵軍艦隊HP' );
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
        console.log( `#${i + 1} ${ship.api_name}(Lv${data.api_ship_lv[i]}) ${data.api_e_nowhps[i]}/${data.api_e_maxhps[i]}` );
    }

    console.log( '自軍艦隊HP' );
    for( let i = 0; i < data.api_f_nowhps.length; i++ ){
        console.log( `#${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} ${data.api_f_nowhps[i]}/${data.api_f_maxhps[i]}` );
    }

    //--- 砲撃戦
    console.log( '*** 砲撃戦 ***' );
    if( data.api_hougeki ){
        GunBattle( data.api_hougeki, myfleet, data );
    }

    //--- 結果
    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}

function AirBattle( data ){
    console.log( `第${data.api_deck_id}艦隊 航空戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    console.log( '敵軍艦隊HP' );
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
        console.log( `${ship.api_name}(Lv${data.api_ship_lv[i]}) ${data.api_e_nowhps[i]}/${data.api_e_maxhps[i]}` );
    }

    console.log( '自軍艦隊HP' );
    for( let i = 0; i < data.api_f_nowhps.length; i++ ){
        console.log( `${KanColle._api_ship[myfleet.api_ship[i]]._name} ${data.api_f_nowhps[i]}/${data.api_f_maxhps[i]}` );
    }

    console.log( '*** 航空戦1 ***' );
    if( data.api_kouku && data.api_kouku.api_stage3 ){
        let raigeki = data.api_kouku.api_stage3;
        TorpedoBattle( raigeki, myfleet, data );
    }

    console.log( '*** 航空戦2 ***' );
    if( data.api_kouku2 && data.api_kouku2.api_stage3 ){
        let raigeki = data.api_kouku2.api_stage3;
        TorpedoBattle( raigeki, myfleet, data );
    }

    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}


let kcsapicall = {
    "api_start2": function( data ){
        UpdateMasterData( data.api_data );
    },
    "api_port/port": function( data ){
        UpdateMissionTimer( data.api_data.api_deck_port );
        UpdateRepairTimer( data.api_data.api_ndock );
        UpdateShipFull( data.api_data.api_ship );
        UpdateMaterial( data.api_data.api_material );
        UpdateBasic( data.api_data.api_basic );
    },
    "api_get_member/material": function( data ){
        UpdateMaterial( data.api_data );
    },
    "api_get_member/deck": function( data ){
        UpdateMissionTimer( data.api_data );
    },
    "api_get_member/ndock": function( data ){
        UpdateRepairTimer( data.api_data );
    },
    "api_get_member/kdock": function( data ){
        UpdateBuildTimer( data.api_data );
    },
    "api_get_member/require_info": function( data ){
        UpdateBuildTimer( data.api_data.api_kdock );
        UpdateSlotitem( data.api_data.api_slot_item );
    },
    "api_req_kousyou/getship": function( data ){
        UpdateBuildTimer( data.api_data.api_kdock );

        // 建造艦娘の記録
        let ship = KanColle._api_mst_ship[data.api_data.api_ship_id];
        let create_data = {
            'api_quest_name': '建造',
            'api_enemy_info': {
                'api_deck_name': ''
            },
            'api_get_ship': {
                'api_ship_type': KanColle._api_mst_stype[ship.api_stype].api_name,
                'api_ship_name': ship.api_name
            },
            'api_win_rank': ''
        };
        RecordDropShip( create_data );

        // TODO 散らばった装備品の似通った処理を整理したい
        for( let item of data.api_data.api_slotitem ){
            item._mst_data = KanColle._api_mst_slotitem[item.api_slotitem_id];
            KanColle._api_slot_item[item.api_id] = item;
        }
        SetLocalStorage( 'slotitem', KanColle._api_slot_item );
    },
    "api_get_member/ship_deck": function( data ){
        // 戦闘後に更新される艦艇のデータ
        let ships = data.api_data.api_ship_data;
        UpdateShipPartial( ships );
        UpdateDeck( data.api_data );
    },
    "api_get_member/ship3": function( data ){
        // 改装したときに届く更新データ
        let ships = data.api_data.api_ship_data;
        UpdateShipPartial( ships );
    },
    "api_req_kousyou/createitem": function( data ){
        // 工廠でアイテム開発
        let item = data.api_data.api_slot_item;
        if( item ){
            item._mst_data = KanColle._api_mst_slotitem[item.api_slotitem_id];
            KanColle._api_slot_item[item.api_id] = item;
        }
        SetLocalStorage( 'slotitem', KanColle._api_slot_item );
    },
    "api_get_member/slot_item": function( data ){
        // 出撃後にやってくる装備品一覧
        UpdateSlotitem( data.api_data );
    },

    "api_req_member/itemuse": function( data ){
        // TODO アイテム使用でもらえる装備品は滅多にないので動作確認できないけど作成
        if( data.api_data.api_getitem && data.api_data.api_slotitem ){
            // data.api_data.api_getitem;
            let item = data.api_data.api_slotitem;
            item._mst_data = KanColle._api_mst_slotitem[item.api_slotitem_id];
            KanColle._api_slot_item[item.api_id] = item;
        }
    },

    "api_get_member/questlist": function( data ){
        UpdateQuestList( data.api_data );
    },
    "api_req_quest/stop": function( data ){
        // TODO 任務の取り消し
        // POSTした内容が読めないので何をキャンセルしたのか分からない
    },

    "api_req_hokyu/charge": function( data ){
        for( let ship of data.api_data.api_ship ){
            let s = KanColle._api_ship[ship.api_id];
            s.api_bull = ship.api_bull;
            s.api_fuel = ship.api_fuel;
        }
        // 艦隊表示を更新させるため
        SetLocalStorage( 'deck', KanColle.deck );
    },

    "api_req_hensei/preset_select": function( data ){
        for( let i = 0, f; f = KanColle.deck[i]; i++ ){
            if( f.api_id == data.api_data.api_id ){
                KanColle.deck[i] = data.api_data;
            }
        }
        SetLocalStorage( 'deck', KanColle.deck );
    },

    "api_req_sortie/battle": function( data ){
        NormalDaytimeBattle( data.api_data );
    },
    "api_req_battle_midnight/battle": function( data ){
        NormalMidnightBattle( data.api_data );
    },

    "api_req_battle_midnight/sp_midnight": function( data ){
        // 5-3 の夜戦マップ
        NormalMidnightBattle( data.api_data );
    },
    "api_req_sortie/airbattle": function( data ){
        // 1-6 の航空戦
        AirBattle( data.api_data );
    },

    "api_req_sortie/ld_airbattle": function( data ){
        AirBattle( data.api_data );
    },

    "api_req_practice/battle": function( data ){
        NormalDaytimeBattle( data.api_data );
    },

    "api_req_practice/midnight_battle": function( data ){
        NormalMidnightBattle( data.api_data );
    },

    "api_req_sortie/battleresult": function( data ){
        KanColle.battle_report.map_name = data.api_data.api_quest_name;
        KanColle.battle_report.enemy_name = data.api_data.api_enemy_info.api_deck_name;

        RecordDropShip( data.api_data );

        // TODO このタイミングで戦闘結果を表示する
        SetLocalStorage( 'battle_report', KanColle.battle_report );
    },

    "api_req_practice/battle_result": function( data ){
        KanColle.battle_report.map_name = "演習";
        KanColle.battle_report.enemy_name = data.api_data.api_enemy_info.api_deck_name;

        SetLocalStorage( 'battle_report', KanColle.battle_report );
    },

    "api_req_combined_battle/battleresult": function( data ){
        RecordDropShip( data.api_data );

        // TODO 連合艦隊は未実装
        SetLocalStorage( 'battle_report', {} );
    },

    "api_req_kousyou/destroyship": function( data ){
        // TODO 解体 POSTデータ読めないのでどの艦を解体したのか分からない
    },
    "api_req_kousyou/destroyitem2": function( data ){
        // TODO 破棄 同上
    }

};

function ProcessData( details, data ){
    console.log( `URL: ${details.url.substring( 1 )}` );
    console.log( data );

    let url = details.url;
    let k = url.match( /kcsapi\/(.*)/ );

    if( typeof kcsapicall[k[1]] === "function" ){
        kcsapicall[k[1]]( data );
    }
}


function KanColleHttpCapture( details ){
    /* requestBodyにアクセスすると upload streams with headers are unsupported とのことで艦これのPOSTリクエストの送信内容を読めない */
    let filter = browser.webRequest.filterResponseData( details.requestId );
    let decoder = new TextDecoder( "utf-8" );

    filter._kancolle = '';
    filter.ondata = ( event ) =>{
        filter.write( event.data );
        filter._kancolle += decoder.decode( event.data, {stream: true} );
    };
    filter.onstop = ( event ) =>{
        filter.disconnect();

        let text = filter._kancolle.substring( filter._kancolle.indexOf( 'svdata=' ) + 7 );
        try{
            let data = JSON.parse( text );
            ProcessData( details, data );
        }catch( e ){
            console.log( `JSON.parse failed. ${e}` );
            console.log( e );
        }
    };

    return {};
}


browser.webRequest.onBeforeRequest.addListener(
    KanColleHttpCapture,
    {urls: ["*://*/kcsapi/*"], types: ["object_subrequest"]},
    ["blocking", "requestBody"]
);

LoadMasterData();


let tmp = localStorage.getItem( 'kct_resource' );
if( tmp ){
    KanColle.resourcelog = JSON.parse( tmp );
}

window.addEventListener( 'unload', ( ev ) =>{
    console.log( 'unload background page.' );
    localStorage.setItem( 'kct_test', Math.random() );
} );


/* 艦これページが開いたときに艦これタイマーウィンドウを開く */
async function OpenWin(){
    let result = await browser.storage.local.get( 'kct_config' );
    if( result ){
        if( !result.kct_config['auto-open-window'] ) return;
    }else{
        return;
    }

    let windows = await browser.windows.getAll();

    for( let win of windows ){
        if( win.title.match( /moz-extension:.*艦これタイマーX/ ) ){
            browser.windows.update( win.id, {focused: true} );
            return;
        }
    }
    OpenWindow( '../sidebar/sidebar.html', 272, 480 );
}

let filter = {
    url: [
        {hostContains: "dmm.com"}
    ]
};
browser.webNavigation.onDOMContentLoaded.addListener(
    ( details ) =>{
        // http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/
        if( details.url.match( /dmm\.com\/netgame\/social\/.*\/app_id=854854/ ) ){
            console.log( 'open kct window.' );
            OpenWin();
        }
    },
    filter
);


/*--- page actionの設定 ---*/

async function CaptureScreenshot(){
    let zoom = await browser.tabs.getZoom();
    let ss = await browser.tabs.captureVisibleTab();
    let result = await browser.storage.local.get( 'kct_config' );
    let is_jpeg = (result && result.kct_config['ss-format-jpeg']) || 0;

    let image = new Image();
    image.onload = ( ev ) =>{
        let canvas = document.createElement( 'canvas' );
        let w = KanColle._ss_flash_position.w * zoom;
        let h = KanColle._ss_flash_position.h * zoom;
        canvas.width = w;
        canvas.height = h;

        let ctx = canvas.getContext( "2d" );
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        ctx.save();
        ctx.scale( 1.0, 1.0 );

        let x = KanColle._ss_game_position.offset_x + KanColle._ss_flash_position.offset_x - KanColle._ss_game_position.scroll_x;
        let y = KanColle._ss_game_position.offset_y + KanColle._ss_flash_position.offset_y - KanColle._ss_game_position.scroll_y;
        x *= zoom;
        y *= zoom;
        ctx.drawImage( image, x, y, w, h, 0, 0, w, h );

        ctx.restore();

        let dt = canvas.toDataURL( is_jpeg ? 'image/jpeg' : 'image/png' );
        dt = dt.replace( /^data:image\/[^;]*/, 'data:application/octet-stream' );

        let bin = atob( dt.split( ',' )[1] );
        let ab = new ArrayBuffer( bin.length );
        let ia = new Uint8Array( ab );
        for( let i = 0; i < bin.length; i++ ){
            ia[i] = bin.charCodeAt( i );
        }

        let name = `screenshot-${GetNowDateString()}.${is_jpeg ? 'jpg' : 'png'}`;
        let blob = new Blob( [ab], {type: "application/octet-stream"} );
        let dl = window.URL.createObjectURL( blob );
        browser.downloads.download( {
            url: dl,
            filename: name,
            saveAs: false,
        } ).then( ( id ) =>{
            console.log( `screenshot saved: ${id}` )
        }, ( err ) =>{
            console.log( err );
        } );
    };
    image.src = ss;
}


function initializePageAction( tab ){
    if( tab.url.match( /www.dmm.com\/.*\/app_id=854854/ ) ){
        browser.pageAction.setIcon( {tabId: tab.id, path: "../img/camera.svg"} );
        browser.pageAction.setTitle( {tabId: tab.id, title: '艦これ画面撮影'} );
        browser.pageAction.show( tab.id );
    }
}

browser.tabs.query( {} ).then( ( tabs ) =>{
    for( let tab of tabs ){
        initializePageAction( tab );
    }
} );

browser.tabs.onUpdated.addListener( ( id, changeInfo, tab ) =>{
    initializePageAction( tab );
} );

browser.pageAction.onClicked.addListener( ( ev ) =>{
    console.log( 'Take KanColle screenshot.' );
    CaptureScreenshot();
} );
