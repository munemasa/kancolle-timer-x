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

async function loadOptions(){

    let config = await browser.storage.local.get( 'kct_config' );
    console.log( config );

    config = config.kct_config;
    document.querySelector( '#ss-format-jpeg' ).checked = config['ss-format-jpeg'];
    document.querySelector( '#notify-popup' ).checked = config['notify-popup'];
    document.querySelector( '#auto-open-window' ).checked = config['auto-open-window'];

    document.querySelector( '#snd-mission-finished' ).value = config['snd-mission-finished'] || '';
    document.querySelector( '#snd-mission-finish-soon' ).value = config['snd-mission-finish-soon'] || '';
    document.querySelector( '#snd-repair-finished' ).value = config['snd-repair-finished'] || '';
    document.querySelector( '#snd-repair-finish-soon' ).value = config['snd-repair-finish-soon'] || '';
    document.querySelector( '#snd-build-finished' ).value = config['snd-build-finished'] || '';
    document.querySelector( '#snd-build-finish-soon' ).value = config['snd-build-finish-soon'] || '';
    document.querySelector( '#webhook' ).value = config['webhook'] || '';

    document.querySelector( '#font-size' ).value = config['font-size'] || 9;
}

function saveOptions( ev ){
    ev.preventDefault();

    let config = {};
    config['ss-format-jpeg'] = document.querySelector( '#ss-format-jpeg' ).checked;
    config['notify-popup'] = document.querySelector( '#notify-popup' ).checked;
    config['snd-mission-finished'] = document.querySelector( '#snd-mission-finished' ).value;
    config['snd-mission-finish-soon'] = document.querySelector( '#snd-mission-finish-soon' ).value;
    config['snd-repair-finished'] = document.querySelector( '#snd-repair-finished' ).value;
    config['snd-repair-finish-soon'] = document.querySelector( '#snd-repair-finish-soon' ).value;
    config['snd-build-finished'] = document.querySelector( '#snd-build-finished' ).value;
    config['snd-build-finish-soon'] = document.querySelector( '#snd-build-finish-soon' ).value;
    config['webhook'] = document.querySelector( '#webhook' ).value;

    config['auto-open-window'] = document.querySelector( '#auto-open-window' ).checked;
    config['font-size'] = document.querySelector( '#font-size' ).value;

    browser.storage.local.set( {
        'kct_config': config
    } );
}


window.addEventListener( 'load', function( ev ){
    loadOptions();

    document.querySelector( "form" ).addEventListener( "submit", function( ev ){
        saveOptions( ev );
    } );
} );