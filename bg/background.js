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

let KanColle = {};


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

function HandleMessage( request, sender, sendResponse ){
    switch( request.cmd ){
    case 'get-mission-name':
        GetMissionName( request, sender, sendResponse );
        break;
    case 'get-ship-name':
        GetShipName( request, sender, sendResponse );
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


function UpdateMasterData( data ){
    for( let k in data.api_data ){
        KanColle[k] = data.api_data[k];
    }

    let shipdata = {};
    for( let ship of KanColle.api_mst_ship ){
        shipdata[ship.api_id] = ship;
    }
    KanColle._api_mst_ship = shipdata;

    SetLocalStorage( 'mst_data', data.api_data );
}

function UpdateMissionTimer( data ){
    KanColle.deck = data;
    SetLocalStorage( 'deck', data );
}

function UpdateRepairTimer( data ){
    KanColle.ndock = data;
    SetLocalStorage( 'ndock', data );
}

function UpdateShip( api_ship ){
    let shipdata = {};
    for( let ship of api_ship ){
        shipdata[ship.api_id] = ship;
    }
    KanColle._api_ship = shipdata;
}


let callback = {
    "api_start2": function( data ){
        UpdateMasterData( data );
    },
    "api_port/port": function( data ){
        UpdateMissionTimer( data.api_data.api_deck_port );
        UpdateRepairTimer( data.api_data.api_ndock );
        UpdateShip( data.api_data.api_ship );
    },
    "api_get_member/deck": function( data ){
        UpdateMissionTimer( data.api_data );
    },

    "api_get_member/ndock": function( data ){
        UpdateRepairTimer( data.api_data );
    }
};

function Process( details, data ){
    console.log( `URL: ${details.url.substring( 1 )} ${details.requestId}` );
    console.log( data );

    let url = details.url;
    let k = url.match( /kcsapi\/(.*)/ );

    if( typeof callback[k[1]] === "function" ){
        callback[k[1]]( data );
    }
}


function KanColleCapture( details ){
    /* Firefoxの仕様で upload streams with headers をサポートしていないため艦これの requestBody を読めない */
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
            Process( details, data );
        }catch( e ){
            console.log( `JSON.parse failed. ${e}` );
        }
    };

    return {};
}


browser.webRequest.onBeforeRequest.addListener(
    KanColleCapture,
    {urls: ["*://*/kcsapi/*"], types: ["object_subrequest"]},
    ["blocking", "requestBody"]
);
