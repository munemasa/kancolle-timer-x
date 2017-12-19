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


function LoadValue( key, config, defvalue ){
    document.querySelector( `#${key}` ).value = config[key] || defvalue;
}

function LoadBool( key, config, defvalue ){
    document.querySelector( `#${key}` ).checked = config[key] || defvalue;
}

async function LoadOptions(){

    let config = await browser.storage.local.get( 'kct_config' );
    console.log( config );

    config = config.kct_config;
    LoadBool( 'auto-open-window', config, false );
    LoadBool( 'ss-format-jpeg', config, false );
    LoadBool( 'notify-popup', config, false );
    LoadBool( 'popup-mission-finished', config, false );
    LoadBool( 'popup-mission-1min-before', config, false );
    LoadBool( 'popup-repair-finished', config, false );
    LoadBool( 'popup-repair-1min-before', config, false );
    LoadBool( 'popup-build-finished', config, false );
    LoadBool( 'popup-build-1min-before', config, false );

    LoadValue( 'snd-mission-finished', config, '' );
    LoadValue( 'snd-mission-finish-soon', config, '' );
    LoadValue( 'snd-repair-finished', config, '' );
    LoadValue( 'snd-repair-finish-soon', config, '' );
    LoadValue( 'snd-build-finished', config, '' );
    LoadValue( 'snd-build-finish-soon', config, '' );
    LoadValue( 'webhook', config, '' );

    LoadValue( 'font-size', config, 9 );
}

function SaveValue( key, config ){
    config[key] = document.querySelector( `#${key}` ).value;
}

function SaveBool( key, config, value ){
    config[key] = document.querySelector( `#${key}` ).checked;
}

function SaveOptions( ev ){
    ev.preventDefault();

    let config = {};
    SaveBool( 'auto-open-window', config );
    SaveBool( 'ss-format-jpeg', config );
    SaveBool( 'notify-popup', config );
    SaveBool( 'popup-mission-finished', config );
    SaveBool( 'popup-mission-1min-before', config );
    SaveBool( 'popup-repair-finished', config );
    SaveBool( 'popup-repair-1min-before', config );
    SaveBool( 'popup-build-finished', config );
    SaveBool( 'popup-build-1min-before', config );

    SaveValue( 'snd-mission-finished', config );
    SaveValue( 'snd-mission-finish-soon', config );
    SaveValue( 'snd-repair-finished', config );
    SaveValue( 'snd-repair-finish-soon', config );
    SaveValue( 'snd-build-finished', config );
    SaveValue( 'snd-build-finish-soon', config );
    SaveValue( 'webhook', config );

    SaveValue( 'font-size', config );

    browser.storage.local.set( {
        'kct_config': config
    } );
}


window.addEventListener( 'load', function( ev ){
    LoadOptions();

    document.querySelector( "form" ).addEventListener( "submit", function( ev ){
        SaveOptions( ev );
    } );
} );