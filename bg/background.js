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

/**
 * 砲撃戦
 * 艦のインデックスが本体・随伴護衛艦隊を連結した状態でのものになっているので
 * あらかじめ連結しておくと通常、連合艦隊で同様の処理ができる。
 * @param hougeki
 * @param myfleet
 * @param data
 * @param friendly 友軍艦隊(NPC)のときにtrue
 */
function GunBattle( hougeki, myfleet, data, friendly ){
    if( !hougeki ) return;
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
                if( !friendly ){
                    // 友軍艦隊(NPC)のときには
                    // api_e_nowhps には友軍艦隊の与ダメージ分は計算済みでやってくるので
                    // 減算してはならない
                    data.api_e_nowhps[def] -= damage;
                }
                let name = !friendly ? KanColle._api_ship[myfleet.api_ship[atk]]._name : KanColle._api_mst_ship[myfleet.api_ship[atk]].api_name;
                console.log( `#${j} ${name} が ${ship.api_name} に ${damage} ダメージ` );
            }else{
                data.api_f_nowhps[def] -= damage;
                let name = !friendly ? KanColle._api_ship[myfleet.api_ship[def]]._name : KanColle._api_mst_ship[myfleet.api_ship[def]].api_name;
                console.log( `#${j} ${name} に ${damage} ダメージ` );
            }
        }
    }
}


/**
 * 雷撃戦などのダメージ処理(本体艦隊用)
 * @param raigeki 雷撃の与ダメージ
 * @param myfleet 自軍の艦隊(名前表示用)
 * @param data 艦これのバトルデータ自体
 */
function TorpedoBattle( raigeki, myfleet, data ){
    if( !raigeki ) return;
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
 * 雷撃などのタメージ処理(随伴護衛艦隊用)
 * @param raigeki
 * @param myfleet 自軍の艦隊(名前表示用)
 * @param data
 */
function TorpedoBattleCombined( raigeki, myfleet, data ){
    if( !raigeki ) return;
    // 自軍→敵軍
    if( raigeki.api_edam ){
        for( let i = 0; i < raigeki.api_edam.length; i++ ){
            let damage = raigeki.api_edam[i];
            if( damage > 0 ){
                damage = parseInt( damage );
                data.api_e_nowhps_combined[i] -= damage;
                let ship = KanColle._api_mst_ship[data.api_ship_ke_combined[i]];
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
                data.api_f_nowhps_combined[i] -= damage;
                console.log( `#${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} に ${damage} ダメージ` );
            }
        }
    }
}


/**
 * 自軍・敵軍艦隊の表示
 * @param data
 * @param myfleet
 */
function DispFleet( data, myfleet ){
    console.log( '敵軍艦隊HP' );
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        let ship = KanColle._api_mst_ship[data.api_ship_ke[i]];
        console.log( `${i + 1} ${ship.api_name}(Lv${data.api_ship_lv[i]}) ${data.api_e_nowhps[i]}/${data.api_e_maxhps[i]}` );
    }
    if( data.api_e_nowhps_combined ){
        for( let i = 0; i < data.api_e_nowhps_combined.length; i++ ){
            let ship = KanColle._api_mst_ship[data.api_ship_ke_combined[i]];
            console.log( `${i + 1} ${ship.api_name}(Lv${data.api_ship_lv_combined[i]}) ${data.api_e_nowhps_combined[i]}/${data.api_e_maxhps_combined[i]}` );
        }
    }

    console.log( '自軍艦隊HP' );
    for( let i = 0; i < data.api_f_nowhps.length; i++ ){
        console.log( `${i + 1} ${KanColle._api_ship[myfleet.api_ship[i]]._name} ${data.api_f_nowhps[i]}/${data.api_f_maxhps[i]}` );
    }
    if( data.api_f_nowhps_combined ){
        for( let i = 0; i < data.api_f_nowhps_combined.length; i++ ){
            console.log( `${i + 1} ${KanColle._api_ship[myfleet.api_ship_combined[i]]._name} ${data.api_f_nowhps_combined[i]}/${data.api_f_maxhps_combined[i]}` );
        }
    }
}

/**
 * 戦闘結果を表示する.
 * 連合艦隊の場合、本体艦隊に随伴艦隊のデータを連結しておく
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

/**
 * 陣形を表示
 * @param data
 */
function DispFormation( data ){
    let form = ['', '単縦陣', '複縦陣', '輪形陣', '梯形陣', '単横陣', '警戒陣'];
    let form2 = ['', '同航戦', '反航戦', 'T字有利', 'T字不利'];
    console.log( `自軍 ${form[data.api_formation[0]]} 敵軍 ${form[data.api_formation[1]]}` );
    console.log( `${form2[data.api_formation[2]]}` );
}


/**
 * 支援艦隊のダメージ処理
 * TODO 本体と護衛艦隊を連結した状態で処理していいいはず
 * @param api_support_info
 * @param data
 */
function AttackBySupportFleet( api_support_info, data ){
    try{
        if( api_support_info ){
            if( api_support_info.api_support_airatack ){
                let fleet_no = api_support_info.api_support_airatack.api_deck_id;
                console.log( `第${fleet_no}艦隊の支援攻撃` );
                let raigeki = api_support_info.api_support_airatack.api_stage3;
                let support_fleet = KanColle.getDeck( fleet_no );
                TorpedoBattle( raigeki, support_fleet, data );
            }
            if( api_support_info.api_support_hourai ){
                let hourai = api_support_info.api_support_hourai;
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
    }catch( e ){
        // 未確認の支援艦隊があるので、不意に処理が中断しないように。
        console.log( e );
    }
}


/**
 * 通常艦隊の昼戦
 * @param data
 */
function NormalDaytimeBattle( data ){
    console.log( `第${data.api_deck_id}艦隊 昼戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    DispFleet( data, myfleet );
    DispFormation( data );

    console.log( '*** 基地航空隊 ***' );
    if( data.api_air_base_attack ){
        let i = 1;
        for( let air_base_atk of data.api_air_base_attack ){
            console.log( `${i}次攻撃` );
            TorpedoBattle( air_base_atk.api_stage3, myfleet, data );
            i++;
        }
    }

    console.log( '*** 支援艦隊 ***' );
    AttackBySupportFleet( data.api_support_info, data );

    console.log( '*** 先制爆雷 ***' );
    // 砲撃戦と同じ処理
    GunBattle( data.api_opening_taisen, myfleet, data );

    //--- 開幕戦
    console.log( '*** 先制雷撃戦 ***' );
    TorpedoBattle( data.api_opening_atack, myfleet, data );

    console.log( '*** 噴式強襲航空攻撃 ***' );
    if( data.api_injection_kouku ){
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
        // 艦艇へのダメージ処理はここだけ
        TorpedoBattle( data.api_kouku.api_stage3, myfleet, data );
    }

    //--- 砲撃戦1
    console.log( '*** 砲撃戦1 ***' );
    GunBattle( data.api_hougeki1, myfleet, data );
    console.log( '*** 砲撃戦2 ***' );
    GunBattle( data.api_hougeki2, myfleet, data );
    console.log( '*** 砲撃戦3 ***' );
    GunBattle( data.api_hougeki3, myfleet, data );

    //--- 雷撃戦
    console.log( '*** 雷撃戦 ***' );
    TorpedoBattle( data.api_raigeki, myfleet, data );

    //--- 結果
    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}

/**
 * 通常艦隊での夜戦
 * @param data
 */
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

    AttackBySupportFleet( data.api_n_support_info, myfleet );

    //--- 砲撃戦
    console.log( '*** 砲撃戦 ***' );
    if( data.api_hougeki ){
        GunBattle( data.api_hougeki, myfleet, data );
    }

    //--- 結果
    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}

/**
 * 通常艦隊の航空戦
 * @param data
 */
function AirBattle( data ){
    console.log( `第${data.api_deck_id}艦隊 航空戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    DispFleet( data, myfleet );

    console.log( '*** 航空戦1 ***' );
    if( data.api_kouku ){
        TorpedoBattle( data.api_kouku.api_stage3, myfleet, data );
    }

    console.log( '*** 航空戦2 ***' );
    if( data.api_kouku2 ){
        TorpedoBattle( data.api_kouku2.api_stage3, myfleet, data );
    }

    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}


function CombinedAirBattle( data ){
    // 連合艦隊vs通常艦隊
    console.log( `連合艦隊 航空戦` );

    let fleet1 = KanColle.getDeck( 1 );
    let fleet2 = KanColle.getDeck( 2 );
    fleet1.api_ship_combined = fleet2.api_ship;
    let myfleet = fleet1;

    DispFleet( data, myfleet );

    console.log( '*** 基地航空隊 ***' );
    // TODO 重複部分を整理
    if( data.api_air_base_attack ){
        let i = 1;
        for( let air_base_atk of data.api_air_base_attack ){
            console.log( `${i}次攻撃` );
            TorpedoBattle( air_base_atk.api_stage3, myfleet, data );

            // TODO この処理は存在する？
            TorpedoBattleCombined( air_base_atk.api_stage3_combined, myfleet, data );
            i++;
        }
    }

    console.log( '*** 航空戦1 ***' );
    if( data.api_kouku ){
        TorpedoBattle( data.api_kouku.api_stage3, fleet1, data );
        TorpedoBattleCombined( data.api_kouku.api_stage3_combined, fleet2, data );
    }

    console.log( '*** 航空戦2 ***' );
    if( data.api_kouku2 ){
        TorpedoBattle( data.api_kouku2.api_stage3, fleet1, data );
        TorpedoBattleCombined( data.api_kouku2.api_stage3_combined, fleet2, data );
    }

    console.log( '*** 結果 ***' );
    data.api_f_nowhps = data.api_f_nowhps.concat( data.api_f_nowhps_combined || [] );
    data.api_f_maxhps = data.api_f_maxhps.concat( data.api_f_maxhps_combined || [] );
    myfleet.api_ship = fleet1.api_ship.concat( fleet2.api_ship );
    DispBattleResult( myfleet, data );
}

function CombinedNightToDayBattle( data ){
    // 通常艦隊vs連合艦隊
    console.log( `第${data.api_deck_id}艦隊 払暁戦` );
    let myfleet = KanColle.getDeck( data.api_deck_id );

    DispFleet( data, myfleet );

    let e_n = data.api_e_maxhps.length;
    // let f_n = data.api_f_maxhps.length;

    // 砲撃戦ダメージ処理の被ダメインデックスが連結した値なので、連結すると通常通りに処理できる
    data.api_e_maxhps = data.api_e_maxhps.concat( data.api_e_maxhps_combined );
    data.api_e_nowhps = data.api_e_nowhps.concat( data.api_e_nowhps_combined );
    data.api_ship_ke = data.api_ship_ke.concat( data.api_ship_ke_combined );
    data.api_ship_lv = data.api_ship_lv.concat( data.api_ship_lv_combined );
    // data.api_f_maxhps = data.api_f_maxhps.concat( data.api_f_maxhps_combined || [] );
    // data.api_f_nowhps = data.api_f_nowhps.concat( data.api_f_nowhps_combined || [] );

    // 支援艦隊
    console.log( '*** 支援艦隊(夜戦) ***' );
    // 支援艦隊のダメージ処理
    AttackBySupportFleet( data.api_n_support_info, data );

    console.log( '*** 砲撃戦(夜戦) ***' );
    GunBattle( data.api_n_hougeki1, myfleet, data );
    GunBattle( data.api_n_hougeki2, myfleet, data );

    //*** 昼戦は combined の方の艦隊と戦うので、
    //*** 連結したものを combined のみに差し替える
    data._api_e_nowhps = data.api_e_nowhps;
    data._api_ship_ke = data.api_ship_ke;
    data.api_e_nowhps = data.api_e_nowhps.slice( e_n );
    data.api_ship_ke = data.api_ship_ke.slice( e_n );

    console.log( '*** 支援艦隊(昼戦) ***' );
    // 支援艦隊のダメージ処理
    AttackBySupportFleet( data.api_support_info, data );

    console.log( '*** 先制爆雷 ***' );
    // 砲撃戦と同じ処理
    GunBattle( data.api_opening_taisen, myfleet, data );

    console.log( '*** 先制雷撃戦 ***' );
    TorpedoBattle( data.api_opening_atack, myfleet, data );

    console.log( '*** 航空戦 ***' );
    if( data.api_kouku ){
        // TODO ここの連合艦隊の航空戦の処理は不完全かも
        if( data.api_kouku.api_stage3 ){
            // 艦艇へのダメージ処理はここだけ
            let raigeki = data.api_kouku.api_stage3;
            TorpedoBattle( raigeki, myfleet, data );
        }
        if( data.api_kouku.api_stage3_combined ){
            // 艦艇へのダメージ処理はここだけ
            let raigeki = data.api_kouku.api_stage3_combined;
            TorpedoBattle( raigeki, myfleet, data );
        }
    }

    console.log( '*** 砲撃戦(昼戦) ***' );
    GunBattle( data.api_hougeki1, myfleet, data );

    // 戦闘開始時の状態に戻す
    for( let i = 0; i < data.api_e_nowhps.length; i++ ){
        data._api_e_nowhps[i + e_n] = data.api_e_nowhps[i];
    }
    data.api_e_nowhps = data._api_e_nowhps;
    data.api_ship_ke = data._api_ship_ke;

    DispBattleResult( myfleet, data );
}

/**
 * 連合艦隊(水上艦隊)vs通常艦隊
 * @param data
 */
function CombinedBattleWater( data ){
    CombinedEachBattleWater( data );
}

/**
 * 連合艦隊対応の戦闘処理
 * TODO 通常艦隊と連合艦隊両対応にできそう
 * @param data
 */
function CombinedEachBattleWater( data ){
    console.log( `連合艦隊 昼戦` );

    let fleet1 = KanColle.getDeck( data.api_deck_id );
    let fleet2 = KanColle.getDeck( 2 );
    fleet1.api_ship_combined = fleet2.api_ship;
    let myfleet = fleet1;
    myfleet.api_ship = fleet1.api_ship.concat( fleet2.api_ship );

    DispFleet( data, myfleet );

    // TODO 護衛退避
    // 護衛退避した艦のインデックス 1,2,3,...
    // data.api_escape_idx = [];
    // data.api_escape_idx_combined = [];

    console.log( '*** 基地航空隊 ***' );
    // TODO 重複部分を整理
    if( data.api_air_base_attack ){
        let i = 1;
        for( let air_base_atk of data.api_air_base_attack ){
            console.log( `${i}次攻撃` );
            TorpedoBattle( air_base_atk.api_stage3, fleet1, data );

            // TODO この処理は存在する？
            TorpedoBattleCombined( air_base_atk.api_stage3_combined, fleet2, data );
            i++;
        }
    }

    console.log( '*** 噴式強襲航空攻撃 ***' );
    if( data.api_injection_kouku ){
        TorpedoBattle( data.api_injection_kouku.api_stage3, fleet1, data );
        TorpedoBattleCombined( data.api_injection_kouku.api_stage3_combined, fleet2, data );
    }

    console.log( '*** 航空戦 ***' );
    if( data.api_kouku ){
        TorpedoBattle( data.api_kouku.api_stage3, fleet1, data );
        TorpedoBattleCombined( data.api_kouku.api_stage3_combined, fleet2, data );
    }

    // 砲撃戦、雷撃戦用に連結
    data.api_e_maxhps = data.api_e_maxhps.concat( data.api_e_maxhps_combined || [] );
    data.api_e_nowhps = data.api_e_nowhps.concat( data.api_e_nowhps_combined || [] );
    data.api_ship_ke = data.api_ship_ke.concat( data.api_ship_ke_combined || [] );
    data.api_ship_lv = data.api_ship_lv.concat( data.api_ship_lv_combined || [] );
    data.api_f_maxhps = data.api_f_maxhps.concat( data.api_f_maxhps_combined || [] );
    data.api_f_nowhps = data.api_f_nowhps.concat( data.api_f_nowhps_combined || [] );

    console.log( '*** 支援艦隊 ***' );
    // TODO 支援の確認
    AttackBySupportFleet( data.api_support_info, data );

    console.log( '*** 先制爆雷 ***' );
    // 砲撃戦と同じ処理
    GunBattle( data.api_opening_taisen, myfleet, data );

    console.log( '*** 先制雷撃 ***' );
    TorpedoBattle( data.api_opening_atack, myfleet, data );

    console.log( '*** 砲撃戦1 ***' );
    GunBattle( data.api_hougeki1, myfleet, data );
    console.log( '*** 砲撃戦2 ***' );
    GunBattle( data.api_hougeki2, myfleet, data );
    console.log( '*** 砲撃戦3 ***' );
    GunBattle( data.api_hougeki3, myfleet, data );
    console.log( '*** 雷撃 ***' );
    TorpedoBattle( data.api_raigeki, myfleet, data );

    DispBattleResult( myfleet, data );
}

function CombinedMidnightBattle( data ){
    console.log( `連合艦隊 夜戦` );
    let fleet1 = KanColle.getDeck( data.api_deck_id );
    let fleet2 = KanColle.getDeck( 2 );
    fleet1.api_ship_combined = fleet2.api_ship;
    let myfleet = fleet1;
    myfleet.api_ship = fleet1.api_ship.concat( fleet2.api_ship );

    DispFleet( data, myfleet );

    // 砲撃戦、雷撃戦用に連結
    data.api_e_maxhps = data.api_e_maxhps.concat( data.api_e_maxhps_combined || [] );
    data.api_e_nowhps = data.api_e_nowhps.concat( data.api_e_nowhps_combined || [] );
    data.api_ship_ke = data.api_ship_ke.concat( data.api_ship_ke_combined || [] );
    data.api_ship_lv = data.api_ship_lv.concat( data.api_ship_lv_combined || [] );
    data.api_f_maxhps = data.api_f_maxhps.concat( data.api_f_maxhps_combined || [] );
    data.api_f_nowhps = data.api_f_nowhps.concat( data.api_f_nowhps_combined || [] );

    //--- 友軍艦隊(NPC)
    console.log( '*** 友軍艦隊(NPC) ***' );
    if( data.api_friendly_battle ){
        // これで良さそう
        let friendly_fleet = {
            api_ship: data.api_friendly_info.api_ship_id
        };
        console.log( friendly_fleet );
        let fdata = {
            api_e_nowhps: data.api_e_nowhps,
            api_ship_ke: data.api_ship_ke,
            api_f_nowhps: data.api_friendly_info.api_nowhps
        };
        try{
            // 友軍艦隊のダメージはあらかじめapi_e_nowhpsから引かれているので
            // ダメージ計算時に減らす必要は無い
            GunBattle( data.api_friendly_battle.api_hougeki, friendly_fleet, fdata, true )
        }catch( e ){
            console.log( e );
        }
    }

    //--- 砲撃戦
    console.log( '*** 砲撃戦 ***' );
    GunBattle( data.api_hougeki, myfleet, data );

    //--- 結果
    console.log( '*** 結果 ***' );
    DispBattleResult( myfleet, data );
}

function TestBattle(){
    let friendly = JSON.parse( '{"api_deck_id":1,"api_formation":[14,14,1],"api_f_nowhps":[64,77,16,83,58,7,57,42,43,43,38,32],"api_f_maxhps":[68,89,96,90,58,58,57,57,43,51,38,32],"api_f_nowhps_combined":[57,42,43,43,38,32],"api_f_maxhps_combined":[57,57,43,51,38,32],"api_fParam":[[76,88,85,74],[96,0,92,93],[99,36,70,95],[98,0,84,94],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[77,84,106,78],[77,79,69,75],[63,139,49,63],[56,94,78,68],[48,79,64,49],[59,89,59,59]],"api_ship_ke":[1783,1526,1526,1526,1524,1524,1594,1575,1575,1501,1501,1501],"api_ship_lv":[1,1,1,1,1,1,1,1,1,1,1,1],"api_ship_ke_combined":[1594,1575,1575,1501,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[-4,0,0,0,0,0,0,0,0,0,0,0],"api_e_maxhps":[650,80,80,80,90,90,80,35,35,20,20,20],"api_e_nowhps_combined":[0,0,0,0,0,0],"api_e_maxhps_combined":[80,35,35,20,20,20],"api_eSlot":[[581,582,583,580,-1],[501,503,503,-1,-1],[501,503,503,-1,-1],[501,503,503,-1,-1],[509,509,512,528,-1],[509,509,512,528,-1]],"api_eSlot_combined":[[505,505,515,525,-1],[502,545,542,-1,-1],[502,545,542,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[104,110,98,168],[15,0,0,35],[15,0,0,35],[15,0,0,35],[85,0,70,85],[85,0,70,85]],"api_eParam_combined":[[73,66,72,82],[38,60,30,22],[38,60,30,22],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_friendly_info":{"api_production_type":1,"api_ship_id":[412,411,73,327,328,489,145],"api_ship_lv":[81,82,76,74,73,78,87],"api_nowhps":[41,35,37,15,16,23,30],"api_maxhps":[77,77,50,31,31,31,31],"api_Slot":[[7,7,272,101,-1],[7,7,88,74,-1],[50,50,15,26,-1],[266,15,88,-1,-1],[266,15,88,-1,-1],[266,15,88,-1,-1],[63,63,129,-1,-1]],"api_Param":[[86,0,72,79],[93,0,74,78],[61,58,53,59],[34,64,42,38],[36,55,43,35],[35,50,48,28],[30,69,58,41]],"api_voice_id":[141,141,141,141,141,141,141],"api_voice_p_no":[0,0,0,0,0,0,1]},"api_friendly_battle":{"api_flare_pos":[-1,-1],"api_hougeki":{"api_at_eflag":[0,1,0,0,0,0,0,0],"api_at_list":[0,0,1,2,3,4,5,6],"api_n_mother_list":[0,0,0,0,0,0,0,0],"api_df_list":[[0,0],[4],[0,0],[4],[0,0],[0,-1,-1],[0,0],[0,0]],"api_si_list":[[7,7],[-1],[7,7],[50],[266,15],[266,15,88],[266,15],[63,63]],"api_cl_list":[[1,1],[0],[1,1],[1],[1,1],[1,-1,-1],[1,1],[1,1]],"api_sp_list":[1,0,1,0,2,7,2,1],"api_damage":[[39,26],[0],[48,32],[65],[23,22],[20,-1,-1],[25,21],[16,1]]}},"api_active_deck":[2,1],"api_touch_plane":[-1,-1],"api_flare_pos":[-1,-1],"api_hougeki":{"api_at_eflag":[0,0],"api_at_list":[6,7],"api_n_mother_list":[0,0],"api_df_list":[[0],[0,0]],"api_si_list":[["90"],["6","6"]],"api_cl_list":[[1],[2,1]],"api_sp_list":[0,1],"api_damage":[[20],[97,43]]}}' );
    console.log( friendly );
    CombinedMidnightBattle( friendly );

    let combined_ld_airbattle = JSON.parse( '{"api_deck_id":1,"api_formation":[13,3,2],"api_f_nowhps":[68,89,96,90,58,58,51,38,32,57,57,43],"api_f_maxhps":[68,89,96,90,58,58,51,38,32,57,57,43],"api_f_nowhps_combined":[51,38,32,57,57,43],"api_f_maxhps_combined":[51,38,32,57,57,43],"api_fParam":[[76,88,85,74],[96,0,92,93],[99,36,70,95],[98,0,84,94],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[63,139,49,63]],"api_ship_ke":[1620,1591,1575,1501,1501,1501],"api_ship_lv":[1,1,1,1,1,1],"api_e_nowhps":[350,48,35,20,20,20],"api_e_maxhps":[350,48,35,20,20,20],"api_eSlot":[[556,557,558,532,-1],[550,550,545,525,-1],[502,545,542,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[180,0,130,150],[58,84,88,55],[38,60,30,22],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_midnight_flag":0,"api_search":[1,1],"api_air_base_attack":[{"api_base_id":1,"api_stage_flag":[1,1,1],"api_plane_from":[null,[1,2]],"api_squadron_plane":[{"api_mst_id":53,"api_count":18},{"api_mst_id":168,"api_count":18},{"api_mst_id":52,"api_count":18},{"api_mst_id":138,"api_count":4}],"api_stage1":{"api_f_count":58,"api_f_lostcount":13,"api_e_count":171,"api_e_lostcount":36,"api_disp_seiku":3,"api_touch_plane":[-1,525]},"api_stage2":{"api_f_count":27,"api_f_lostcount":5,"api_e_count":0,"api_e_lostcount":0},"api_stage3":{"api_erai_flag":[1,0,1,0,0,0],"api_ebak_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_edam":[27,0,0,0,0,0]}}],"api_stage_flag":[1,1,1],"api_kouku":{"api_plane_from":[[1,5,6],[1]],"api_stage1":{"api_f_count":121,"api_f_lostcount":1,"api_e_count":132,"api_e_lostcount":40,"api_disp_seiku":1,"api_touch_plane":[-1,-1]},"api_stage2":{"api_f_count":22,"api_f_lostcount":0,"api_e_count":60,"api_e_lostcount":5},"api_stage3":{"api_frai_flag":[0,0,0,0,0,0],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_ebak_flag":[0,0,0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0],"api_edam":[0,0,0,0,0,0]},"api_stage3_combined":{"api_frai_flag":[0,1,0,0,0,0],"api_fbak_flag":[0,0,0,0,1,0],"api_fcl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0]}}}' );
    // console.log( combined_ld_airbattle );
    // CombinedAirBattle( combined_ld_airbattle );

    let ec_night_to_day = JSON.parse( '{"api_deck_id":3,"api_formation":[1,14,3],"api_f_nowhps":[77,77,59,44,35,15,37],"api_f_maxhps":[77,77,63,44,35,35,37],"api_fParam":[[79,0,89,92],[79,0,89,92],[75,84,60,82],[64,110,72,65],[49,71,64,53],[47,71,68,53],[54,89,59,57]],"api_ship_ke":[1529,1524,1524,1524,1524,1524],"api_ship_lv":[1,1,1,1,1,1],"api_ship_ke_combined":[1527,1527,1575,1575,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[98,90,90,90,90,90],"api_e_maxhps":[98,90,90,90,90,90],"api_e_nowhps_combined":[76,76,35,35,20,20],"api_e_maxhps_combined":[76,76,35,35,20,20],"api_eSlot":[[509,509,525,528,-1],[509,509,512,528,-1],[509,509,512,528,-1],[509,509,512,528,-1],[509,509,512,528,-1],[509,509,512,528,-1]],"api_eSlot_combined":[[505,506,515,525,-1],[505,506,515,525,-1],[502,545,542,-1,-1],[502,545,542,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[90,0,80,99],[85,0,70,85],[85,0,70,85],[85,0,70,85],[85,0,70,85],[85,0,70,85]],"api_eParam_combined":[[68,48,40,70],[68,48,40,70],[38,60,30,22],[38,60,30,22],[5,15,6,5],[5,15,6,5]],"api_touch_plane":[-1,-1],"api_flare_pos":[-1,-1],"api_n_support_flag":0,"api_n_support_info":null,"api_n_hougeki1":{"api_at_eflag":[0,1,0,1,0,1,0,1,0,1,0,0],"api_at_list":[0,6,1,7,2,9,3,10,6,8,4,5],"api_n_mother_list":[0,0,0,0,0,0,0,0,0,0,0,0],"api_df_list":[[3,3],[6],[1,1],[4],[5,5],[0],[11],[5],[4],[4],[2],[2]],"api_si_list":[["105","104"],[505],["105","104"],[505],["123","123"],[502],["67"],[501],[-1],[502],[-1],[-1]],"api_cl_list":[[1,1],[1],[2,1],[0],[1,1],[0],[2],[0],[1],[0],[1],[2]],"api_sp_list":[1,0,1,0,1,0,0,0,0,0,0,0],"api_damage":[[47,76],[24.1],[115,53],[0],[122,148],[0],[314],[0],[8.1],[0],[14.1],[36.1]]},"api_n_hougeki2":{"api_at_eflag":[0,1,0,1,0,1,0,0,0],"api_at_list":[0,0,1,2,2,4,3,5,4],"api_n_mother_list":[0,0,0,0,0,0,0,0,0],"api_df_list":[[8,8],[6,6],[10,10],[6,-1,-1],[2,2],[3,-1,-1],[7],[9],[4]],"api_si_list":[["105","104"],[509,509],["105","104"],[509,509,512],["123","123"],[509,509,512],["67"],[-1],[-1]],"api_cl_list":[[1,1],[1,2],[2,2],[1,-1,-1],[1,1],[2,-1,-1],[2],[1],[1]],"api_sp_list":[1,1,1,4,1,4,0,0,0],"api_damage":[[129,121],[1,6],[220,221],[4,-1,-1],[128,117],[26,-1,-1],[162],[57],[28.1]]},"api_day_flag":1,"api_search":[1,1],"api_support_flag":0,"api_support_info":null,"api_stage_flag":[1,0,0],"api_kouku":{"api_plane_from":[null,null],"api_stage1":{"api_f_count":0,"api_f_lostcount":0,"api_e_count":0,"api_e_lostcount":0,"api_disp_seiku":1,"api_touch_plane":[-1,-1]},"api_stage2":null,"api_stage3":null,"api_stage3_combined":null},"api_opening_taisen_flag":0,"api_opening_taisen":null,"api_opening_flag":0,"api_opening_atack":null,"api_hourai_flag":[1,0,0],"api_hougeki1":{"api_at_eflag":[0,1,0,0,0],"api_at_list":[1,4,0,3,2],"api_at_type":[0,0,0,0,0],"api_df_list":[[0],[3],[0],[4],[4]],"api_si_list":[[105],[509],[105],[-1],[123]],"api_cl_list":[[1],[1],[1],[2],[1]],"api_damage":[[89],[14],[96],[4],[50]]}}' );
    // CombinedNightToDayBattle( ec_night_to_day );

    let each_battle_water = JSON.parse( '{"api_deck_id":1,"api_formation":[14,14,2],"api_f_nowhps":[68,87,96,90,58,58],"api_f_maxhps":[68,89,96,90,58,58],"api_f_nowhps_combined":[51,38,32,57,57,43],"api_f_maxhps_combined":[51,38,32,57,57,43],"api_fParam":[[76,88,85,74],[96,0,92,93],[99,36,70,95],[98,0,84,94],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[63,139,49,63]],"api_ship_ke":[1778,1523,1523,1529,1575,1575],"api_ship_lv":[1,1,1,1,1,1],"api_ship_ke_combined":[1554,1591,1501,1501,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[88,70,70,98,35,35],"api_e_maxhps":[88,70,70,98,35,35],"api_e_nowhps_combined":[53,48,20,20,20,20],"api_e_maxhps_combined":[53,48,20,20,20,20],"api_eSlot":[[581,582,583,583,-1],[520,523,516,-1,-1],[520,523,516,-1,-1],[509,509,525,528,-1],[502,545,542,-1,-1],[502,545,542,-1,-1]],"api_eSlot_combined":[[504,542,543,-1,-1],[550,550,545,525,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[35,0,48,73],[0,0,15,35],[0,0,15,35],[90,0,80,99],[38,60,30,22],[38,60,30,22]],"api_eParam_combined":[[42,72,27,36],[58,84,88,55],[5,15,6,5],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_midnight_flag":0,"api_search":[1,1],"api_stage_flag":[1,1,1],"api_kouku":{"api_plane_from":[[1,5,6],[1,2,3]],"api_stage1":{"api_f_count":117,"api_f_lostcount":10,"api_e_count":232,"api_e_lostcount":97,"api_disp_seiku":2,"api_touch_plane":[59,-1]},"api_stage2":{"api_f_count":19,"api_f_lostcount":5,"api_e_count":82,"api_e_lostcount":73,"api_air_fire":{"api_idx":10,"api_kind":11,"api_use_items":[135,131]}},"api_stage3":{"api_frai_flag":[0,0,0,0,0,0],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,1,1,0,0],"api_ebak_flag":[0,0,1,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,7,0,0],"api_edam":[0,0,26.1,0,0,0]},"api_stage3_combined":{"api_frai_flag":[0,0,0,0,0,0],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_ebak_flag":[0,0,0,0,0,1],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0],"api_edam":[0,0,0,0,0,44]}},"api_support_flag":3,"api_support_info":{"api_support_airatack":null,"api_support_hourai":{"api_deck_id":4,"api_ship_id":[440,21795,22731,21660,0,0],"api_undressing_flag":[0,0,0,0,0,0],"api_cl_list":[0,0,0,0,0,0,0,0,0,0,1,0],"api_damage":[0,0,0,0,0,0,0,0,0,0,2,0]}},"api_opening_taisen_flag":0,"api_opening_taisen":null,"api_opening_flag":1,"api_opening_atack":{"api_frai":[-1,-1,-1,-1,-1,-1,10,-1,-1,-1,-1,3],"api_fcl":[0,0,0,0,0,0,1,0,0,0,0,1],"api_fdam":[0,0,0,0,0,0,0,0,0,0,0,0],"api_fydam":[0,0,0,0,0,0,91,0,0,0,0,34],"api_erai":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],"api_ecl":[0,0,0,0,0,0,0,0,0,0,0,0],"api_edam":[0,0,0,34,0,0,0,0,0,0,91,0],"api_eydam":[0,0,0,0,0,0,0,0,0,0,0,0]},"api_hourai_flag":[1,1,1,0],"api_hougeki1":{"api_at_eflag":[0,1,0,1,0,0,1,0],"api_at_list":[2,3,1,0,3,0,5,4],"api_at_type":[0,0,2,0,2,2,0,0],"api_df_list":[[1],[5],[4,4],[2],[0,0],[3,3],[0],[3]],"api_si_list":[[114],[509],["105","103"],[-1],["105","103"],["90","90"],[502],[-1]],"api_cl_list":[[1],[1],[1,1],[0],[1,2],[1,1],[1],[1]],"api_damage":[[78],[46],[164.1,161.1],[0],[116,229],[20,42],[8],[1]]},"api_hougeki2":{"api_at_eflag":[0,1,0,0,0,0],"api_at_list":[0,3,1,2,3,4],"api_at_type":[2,0,6,2,6,0],"api_df_list":[[5,5],[11],[9],[3,3],[2],[6]],"api_si_list":[["90","90"],[509],["59","105","103"],["114","114"],["59","105","103"],[-1]],"api_cl_list":[[1,1],[0],[1],[2,1],[1],[1]],"api_damage":[[93,95],[0],[222],[95,37],[190],[77]]},"api_hougeki3":{"api_at_eflag":[0,1,0,0,0],"api_at_list":[10,7,11,6,9],"api_at_type":[3,0,0,0,0],"api_df_list":[[7],[8],[8],[7],[7]],"api_si_list":[["115","90","135"],[550],[90],[90],[6]],"api_cl_list":[[1],[0],[1],[1],[2]],"api_damage":[[30],[0],[66],[16],[96]]}}' );
    // console.log( each_battle_water );
    // CombinedEachBattleWater( each_battle_water );

    let battle_water = JSON.parse( '{"api_deck_id":1,"api_formation":[14,1,1],"api_f_nowhps":[68,89,96,90,58,58],"api_f_maxhps":[68,89,96,90,58,58],"api_f_nowhps_combined":[51,38,32,57,57,43],"api_f_maxhps_combined":[51,38,32,57,57,43],"api_fParam":[[76,88,85,74],[96,0,92,93],[99,36,70,95],[98,0,84,94],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[63,139,49,63]],"api_ship_ke":[1554,1591,1575,1575,1501,1501],"api_ship_lv":[1,1,1,1,1,1],"api_e_nowhps":[53,48,35,35,20,20],"api_e_maxhps":[53,48,35,35,20,20],"api_eSlot":[[504,542,543,-1,-1],[550,550,545,525,-1],[502,545,542,-1,-1],[502,545,542,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[42,72,27,36],[58,84,88,55],[38,60,30,22],[38,60,30,22],[5,15,6,5],[5,15,6,5]],"api_midnight_flag":0,"api_search":[1,1],"api_stage_flag":[1,1,1],"api_kouku":{"api_plane_from":[[1,5,6],null],"api_stage1":{"api_f_count":102,"api_f_lostcount":1,"api_e_count":0,"api_e_lostcount":0,"api_disp_seiku":1,"api_touch_plane":[59,-1]},"api_stage2":{"api_f_count":19,"api_f_lostcount":2,"api_e_count":0,"api_e_lostcount":0},"api_stage3":{"api_frai_flag":[0,0,0,0,0,0],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_ebak_flag":[0,0,1,0,1,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0],"api_edam":[0,0,0,0,70,0]},"api_stage3_combined":{"api_frai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0]}},"api_support_flag":0,"api_support_info":null,"api_opening_taisen_flag":0,"api_opening_taisen":null,"api_opening_flag":1,"api_opening_atack":{"api_frai":[-1,-1,-1,-1,-1,-1,5,-1,-1,-1,-1,3],"api_fcl":[0,0,0,0,0,0,2,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0,0,0,0,0,0,0],"api_fydam":[0,0,0,0,0,0,154,0,0,0,0,0],"api_erai":[-1,-1,-1,-1,-1,-1,-1],"api_ecl":[0,0,0,0,0,0,0],"api_edam":[0,0,0,0,0,154,0],"api_eydam":[0,0,0,0,0,0,0]},"api_hourai_flag":[1,0,0,0],"api_hougeki1":{"api_at_eflag":[0,1,0,1,0,1,0,0],"api_at_list":[2,0,1,1,3,2,0,4],"api_at_type":[2,0,2,0,2,0,2,0],"api_df_list":[[3,3],[2],[0,0],[2],[0,0],[2],[2,2],[1]],"api_si_list":[["114","114"],[504],["105","103"],[550],["105","103"],[502],["90","90"],[-1]],"api_cl_list":[[1,2],[0],[1,1],[0],[1,2],[0],[1,1],[2]],"api_damage":[[174,275],[0],[5,3],[0],[199,308],[0],[132,131],[207]]}}' );
    // CombinedBattleWater( battle_water );
    // console.log( battle_water );

    // 輸送連合艦隊
    // let combined_battle_battle = JSON.parse( '{"api_deck_id":1,"api_formation":[11,4,3],"api_f_nowhps":[42,42,31,33,40,32],"api_f_maxhps":[42,42,31,33,40,32],"api_f_nowhps_combined":[51,38,32,57,57,32],"api_f_maxhps_combined":[51,38,32,57,57,32],"api_fParam":[[31,55,29,48],[57,54,116,53],[49,79,49,49],[47,78,61,49],[37,39,62,39],[48,79,49,49]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[30,49,30,27]],"api_ship_ke":[1530,1530,1530,1530],"api_ship_lv":[50,50,50,50],"api_e_nowhps":[19,19,19,19],"api_e_maxhps":[19,19,19,19],"api_eSlot":[[513,513,-1,-1,-1],[513,513,-1,-1,-1],[513,513,-1,-1,-1],[513,513,-1,-1,-1]],"api_eParam":[[0,42,0,7],[0,42,0,7],[0,42,0,7],[0,42,0,7]],"api_midnight_flag":0,"api_search":[1,5],"api_stage_flag":[1,1,1],"api_kouku":{"api_plane_from":[[1],null],"api_stage1":{"api_f_count":12,"api_f_lostcount":0,"api_e_count":0,"api_e_lostcount":0,"api_disp_seiku":1,"api_touch_plane":[-1,-1]},"api_stage2":{"api_f_count":12,"api_f_lostcount":0,"api_e_count":0,"api_e_lostcount":0},"api_stage3":{"api_frai_flag":[0,0,0,0,0,0],"api_erai_flag":[0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_ebak_flag":[0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0],"api_fdam":[0,0,0,0,0,0],"api_edam":[0,0,0,0]},"api_stage3_combined":{"api_frai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0]}},"api_support_flag":0,"api_support_info":null,"api_opening_taisen_flag":0,"api_opening_taisen":null,"api_opening_flag":1,"api_opening_atack":{"api_frai":[-1,-1,-1,-1,-1,-1,2,-1,-1,-1,-1,-1],"api_fcl":[0,0,0,0,0,0,0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0,0,0,0,0,0,0],"api_fydam":[0,0,0,0,0,0,0,0,0,0,0,0],"api_erai":[-1,-1,-1,-1,-1,-1,-1],"api_ecl":[0,0,0,0,0,0,0],"api_edam":[0,0,0,0,0,0,0],"api_eydam":[0,0,0,0,0,0,0]},"api_hourai_flag":[1,0,0,0],"api_hougeki1":{"api_at_eflag":[0,0,0,0],"api_at_list":[6,7,8,11],"api_at_type":[0,0,0,0],"api_df_list":[[3],[1],[2],[0]],"api_si_list":[[-1],[-1],[-1],["91"]],"api_cl_list":[[1],[1],[1],[1]],"api_damage":[[41],[40],[35],[52]]}}' );
    // CombinedBattleWater( combined_battle_battle );

    let each_battle = JSON.parse( '{"api_deck_id":1,"api_formation":[14,14,2],"api_f_nowhps":[81,79,31,33,58,58],"api_f_maxhps":[90,89,31,33,58,58],"api_f_nowhps_combined":[40,10,32,54,51,32],"api_f_maxhps_combined":[43,38,32,57,57,32],"api_fParam":[[98,0,84,94],[96,0,92,93],[49,79,49,49],[47,78,61,49],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[69,89,69,69],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[30,50,30,29]],"api_ship_ke":[1620,1525,1525,1541,1594,1594],"api_ship_lv":[1,1,1,1,1,1],"api_ship_ke_combined":[1554,1591,1501,1501,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[350,88,88,84,80,80],"api_e_maxhps":[350,88,88,84,80,80],"api_e_nowhps_combined":[53,48,20,20,20,20],"api_e_maxhps_combined":[53,48,20,20,20,20],"api_eSlot":[[556,557,558,532,-1],[520,517,524,-1,-1],[520,517,524,-1,-1],[508,508,512,525,-1],[505,505,515,525,-1],[505,505,515,525,-1]],"api_eSlot_combined":[[504,542,543,-1,-1],[550,550,545,525,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[180,0,130,150],[0,0,40,55],[0,0,40,55],[60,0,60,80],[73,66,72,82],[73,66,72,82]],"api_eParam_combined":[[42,72,27,36],[58,84,88,55],[5,15,6,5],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_midnight_flag":1,"api_search":[1,1],"api_stage_flag":[1,1,1],"api_kouku":{"api_plane_from":[[5,6],[1,2,3]],"api_stage1":{"api_f_count":83,"api_f_lostcount":8,"api_e_count":348,"api_e_lostcount":160,"api_disp_seiku":2,"api_touch_plane":[59,517]},"api_stage2":{"api_f_count":0,"api_f_lostcount":0,"api_e_count":117,"api_e_lostcount":51},"api_stage3":{"api_frai_flag":[0,1,0,0,0,1],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,0,0,0,0,0],"api_ebak_flag":[0,0,0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,0,0,0,0,0],"api_edam":[0,0,0,0,0,0]},"api_stage3_combined":{"api_frai_flag":[0,1,0,0,0,0],"api_erai_flag":[0,0,0,0,0,0],"api_fbak_flag":[0,1,0,0,0,0],"api_ebak_flag":[0,0,0,0,0,0],"api_fcl_flag":[0,0,0,0,0,0],"api_ecl_flag":[0,0,0,0,0,0],"api_fdam":[0,6,0,0,0,0],"api_edam":[0,0,0,0,0,0]}},"api_support_flag":0,"api_support_info":null,"api_opening_taisen_flag":0,"api_opening_taisen":null,"api_opening_flag":0,"api_opening_atack":null,"api_hourai_flag":[1,1,1,1],"api_hougeki1":{"api_at_eflag":[0,1,0,1,0,1,0,1],"api_at_list":[1,3,0,0,3,5,2,2],"api_at_type":[6,0,6,0,0,0,0,0],"api_df_list":[[4],[4],[1],[5],[2],[0],[3],[4]],"api_si_list":[["59","105","103"],[508],["59","105","103"],[-1],[2],[505],[-1],[-1]],"api_cl_list":[[2],[1],[1],[1],[1],[0],[1],[0]],"api_damage":[[137],[41],[107],[38],[10],[0],[7],[0]]},"api_hougeki2":{"api_at_eflag":[0,1,0,1,0,1,0,1,0,0],"api_at_list":[6,6,10,7,9,8,11,9,8,7],"api_at_type":[2,0,0,0,0,0,0,0,0,0],"api_df_list":[[10,10],[6],[7],[6],[7],[6],[7],[9],[11],[6]],"api_si_list":[["5","5"],[504],[90],[550],[6],[501],[91],[501],[122],[122]],"api_cl_list":[[1,1],[0],[0],[1],[1],[0],[0],[1],[1],[1]],"api_damage":[[55,55],[0],[0],[3],[13],[0],[0],[6],[29],[7]]},"api_raigeki":{"api_frai":[-1,-1,-1,-1,-1,-1,9,-1,9,6,2,9],"api_fcl":[0,0,0,0,0,0,2,0,1,1,1,1],"api_fdam":[0,0,0,0,0,0,0,0,0,5,0,0],"api_fydam":[0,0,0,0,0,0,79,0,46,24,15,28],"api_erai":[-1,-1,-1,-1,-1,-1,9,9,8,1,-1,-1],"api_ecl":[0,0,0,0,0,0,1,1,0,0,0,0],"api_edam":[0,0,15,0,0,0,24,0,0,153,0,0],"api_eydam":[0,0,0,0,0,0,3,2,0,0,0,0]},"api_hougeki3":{"api_at_eflag":[0,1,0,0,1,0,1],"api_at_list":[0,0,1,2,3,3,5],"api_at_type":[6,0,2,0,0,0,0],"api_df_list":[[8],[9],[2,2],[5],[3],[3],[10]],"api_si_list":[["59","105","103"],[-1],["105","103"],[-1],[512],[2],[505]],"api_cl_list":[[1],[1],[1,1],[0],[1],[1],[1]],"api_damage":[[127],[26],[71,70],[0],[24.1],[10.1],[23]]}}' );
    // CombinedEachBattleWater( each_battle );
    // console.log( each_battle );

    let combined_midnight = JSON.parse( '{"api_deck_id":1,"api_formation":[14,3,2],"api_f_nowhps":[42,42,8,29,58,48],"api_f_maxhps":[42,42,31,33,58,58],"api_f_nowhps_combined":[32,38,32,57,53,32],"api_f_maxhps_combined":[51,38,32,57,57,32],"api_fParam":[[31,55,29,48],[57,54,116,53],[49,79,49,49],[47,78,61,49],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[30,49,30,27]],"api_ship_ke":[1614,1523,1591,1575,1501,1501],"api_ship_lv":[1,1,1,1,1,1],"api_e_nowhps":[0,0,2,0,0,0],"api_e_maxhps":[96,70,48,35,20,20],"api_eSlot":[[556,548,558,549,-1],[520,523,516,-1,-1],[550,550,545,525,-1],[502,545,542,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[25,0,50,80],[0,0,15,35],[58,84,88,55],[38,60,30,22],[5,15,6,5],[5,15,6,5]],"api_touch_plane":[-1,-1],"api_flare_pos":[-1,-1],"api_hougeki":{"api_at_eflag":[0],"api_at_list":[6],"api_n_mother_list":[0],"api_df_list":[[2,2]],"api_si_list":[["90","90"]],"api_cl_list":[[1,1]],"api_sp_list":[1],"api_damage":[[0,150]]}}' );
    combined_midnight = JSON.parse( '{"api_deck_id":1,"api_formation":[14,14,1],"api_f_nowhps":[21,25,18,33,58,48],"api_f_maxhps":[90,89,31,33,58,58],"api_f_nowhps_combined":[51,38,29,57,57,7],"api_f_maxhps_combined":[51,38,32,57,57,32],"api_fParam":[[98,0,84,94],[96,0,92,93],[49,79,49,49],[47,78,61,49],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[56,94,78,68],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[30,49,30,27]],"api_ship_ke":[1778,1523,1523,1529,1575,1575],"api_ship_lv":[1,1,1,1,1,1],"api_ship_ke_combined":[1554,1591,1501,1501,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[0,0,0,41,0,0],"api_e_maxhps":[88,70,70,98,35,35],"api_e_nowhps_combined":[0,0,0,0,0,0],"api_e_maxhps_combined":[53,48,20,20,20,20],"api_eSlot":[[581,582,583,583,-1],[520,523,516,-1,-1],[520,523,516,-1,-1],[509,509,525,528,-1],[502,545,542,-1,-1],[502,545,542,-1,-1]],"api_eSlot_combined":[[504,542,543,-1,-1],[550,550,545,525,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[35,0,48,73],[0,0,15,35],[0,0,15,35],[90,0,80,99],[38,60,30,22],[38,60,30,22]],"api_eParam_combined":[[42,72,27,36],[58,84,88,55],[5,15,6,5],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_active_deck":[2,1],"api_touch_plane":[-1,-1],"api_flare_pos":[-1,-1],"api_hougeki":{"api_at_eflag":[0],"api_at_list":[6],"api_n_mother_list":[0],"api_df_list":[[3,3]],"api_si_list":[["90","90"]],"api_cl_list":[[1,1]],"api_sp_list":[1],"api_damage":[[141,0]]}}' );
    // CombinedMidnightBattle( combined_midnight );
    // console.log( combined_midnight );

    let ec_midnight_battle = JSON.parse( '{"api_result":1,"api_result_msg":"\u6210\u529f","api_data":{"api_deck_id":1,"api_formation":[14,14,1],"api_f_nowhps":[81,34,6,6,51,3],"api_f_maxhps":[90,89,31,33,58,58],"api_f_nowhps_combined":[43,35,32,53,57,14],"api_f_maxhps_combined":[43,38,32,57,57,32],"api_fParam":[[98,0,84,94],[96,0,92,93],[49,79,49,49],[47,78,61,49],[34,0,72,65],[34,0,72,65]],"api_fParam_combined":[[69,89,69,69],[48,79,64,49],[59,89,59,59],[77,79,69,75],[77,84,106,78],[30,50,30,29]],"api_ship_ke":[1620,1525,1525,1541,1594,1594],"api_ship_lv":[1,1,1,1,1,1],"api_ship_ke_combined":[1554,1591,1501,1501,1501,1501],"api_ship_lv_combined":[1,1,1,1,1,1],"api_e_nowhps":[281,0,0,0,56,54],"api_e_maxhps":[350,88,88,84,80,80],"api_e_nowhps_combined":[0,0,0,0,0,0],"api_e_maxhps_combined":[53,48,20,20,20,20],"api_eSlot":[[556,557,558,532,-1],[520,517,524,-1,-1],[520,517,524,-1,-1],[508,508,512,525,-1],[505,505,515,525,-1],[505,505,515,525,-1]],"api_eSlot_combined":[[504,542,543,-1,-1],[550,550,545,525,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1],[501,-1,-1,-1,-1]],"api_eParam":[[180,0,130,150],[0,0,40,55],[0,0,40,55],[60,0,60,80],[73,66,72,82],[73,66,72,82]],"api_eParam_combined":[[42,72,27,36],[58,84,88,55],[5,15,6,5],[5,15,6,5],[5,15,6,5],[5,15,6,5]],"api_active_deck":[2,1],"api_touch_plane":[-1,-1],"api_flare_pos":[-1,-1],"api_hougeki":{"api_at_eflag":[0,1,0,0,0,0,0],"api_at_list":[6,0,7,8,9,10,11],"api_n_mother_list":[0,0,0,0,0,0,0],"api_df_list":[[5,5],[9],[0,0],[4,4],[4,4],[0],[0,0]],"api_si_list":[["5","5"],[-1],["122","122"],["122","63"],["6","6"],["90"],["91","63"]],"api_cl_list":[[2,2],[0],[2,1],[1,1],[1,1],[0],[1,1]],"api_sp_list":[1,0,1,1,1,0,1],"api_damage":[[145,157],[0],[44,29],[4,47],[0,98],[0],[22,21]]}}}' );
    // CombinedMidnightBattle( ec_midnight_battle.api_data );
    // console.log( ec_midnight_battle.api_data );
}

let kcsapicall = {
    "api_start2/getData": function( data ){
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

    "api_get_member/ship2": function( data ){
        // TODO 間宮とか使ったときにこれで更新されるが母港に行けばいいのでいちいち処理する必要ないかも
        // UpdateShipFull( data.api_data );
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
        // 通常艦隊の航空戦
        AirBattle( data.api_data );
    },

    "api_req_practice/battle": function( data ){
        // 演習
        NormalDaytimeBattle( data.api_data );
    },

    "api_req_practice/midnight_battle": function( data ){
        // 演習夜戦
        NormalMidnightBattle( data.api_data );
    },

    "api_req_combined_battle/battle": function( data ){
        // 航空機動部隊・輸送護衛部隊での戦闘
        CombinedEachBattleWater( data.api_data );
    },

    "api_req_combined_battle/midnight_battle": function( data ){
        // 航空機動艦隊・輸送護衛部隊の夜戦
        CombinedMidnightBattle( data.api_data );
    },

    "api_req_combined_battle/battle_water": function( data ){
        // 連合艦隊水上艦隊の戦闘
        CombinedBattleWater( data.api_data );
    },

    "api_req_combined_battle/each_battle_water": function( data ){
        // 連合艦隊vs連合艦隊
        CombinedEachBattleWater( data.api_data );
    },

    "api_req_combined_battle/each_battle": function( data ){
        // 連合艦隊vs連合艦隊
        CombinedEachBattleWater( data.api_data );
    },

    "api_req_combined_battle/ec_midnight_battle": function( data ){
        // 連合艦隊vs連合艦隊 夜戦
        CombinedMidnightBattle( data.api_data );
    },

    "api_req_combined_battle/ld_airbattle": function( data ){
        // 連合艦隊の航空戦
        CombinedAirBattle( data.api_data );
    },

    "api_req_combined_battle/ec_night_to_day": function( data ){
        // TODO 2018 winter E-2 前哨戦南 夜戦開始の昼戦へ続く
        CombinedNightToDayBattle( data.api_data );
    },

    "api_req_combined_battle/ec_battle": function( data ){
        // 通常艦隊vs連合艦隊
        CombinedEachBattleWater( data.api_data );
    },

    "api_req_sortie/battleresult": function( data ){
        KanColle.battle_report.map_name = data.api_data.api_quest_name;
        KanColle.battle_report.enemy_name = data.api_data.api_enemy_info.api_deck_name;

        RecordDropShip( data.api_data );

        // このタイミングで戦闘結果を表示する
        SetLocalStorage( 'battle_report', KanColle.battle_report );
    },

    "api_req_combined_battle/goback_port": function( data ){
        // TODO 護衛退避
    },

    "api_req_practice/battle_result": function( data ){
        KanColle.battle_report.map_name = "演習";
        KanColle.battle_report.enemy_name = data.api_data.api_enemy_info.api_deck_name;

        SetLocalStorage( 'battle_report', KanColle.battle_report );
    },

    "api_req_combined_battle/battleresult": function( data ){
        KanColle.battle_report.map_name = data.api_data.api_quest_name;
        KanColle.battle_report.enemy_name = data.api_data.api_enemy_info.api_deck_name;

        RecordDropShip( data.api_data );

        SetLocalStorage( 'battle_report', KanColle.battle_report );
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
    {urls: ["*://*/kcsapi/*"], types: ["object_subrequest", "xmlhttprequest"]},
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
    let is_jpeg = (result && result.kct_config && result.kct_config['ss-format-jpeg']) || 0;

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
