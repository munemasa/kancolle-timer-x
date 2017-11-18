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

console.log( 'load content-script.' );

// document.body.style.border = "5px solid blue";

let data = {};

try{
    // HTML5版
    let leoPlayerProps = window.wrappedJSObject.leoPlayerProps;

    function replacer( key, value ){
        if( key.indexOf( "external" ) == 0 ){
            return undefined;
        }
        return value;
    }

    data = JSON.parse( JSON.stringify( leoPlayerProps, replacer ) );
    data._type = 'html5';
    console.log( `html5 nicolive player detected.` );
}catch( e ){
    // 新配信flash版
    let param = document.querySelector( '#player param[name="flashvars"]' ).getAttribute( 'value' );
    let params = param.split( '&' );

    for( let i = 0, p; p = params[i]; i++ ){
        let d = p.split( '=' );
        data[d[0]] = decodeURIComponent( decodeURIComponent( d[1] ) );
    }
    data._type = 'flash';

    // TODO HTML5とFlashでデータ構造が違うので、共通化する
    data.webSocketBaseUrl = data.webSocketUrl;
    data.title = data.programTitle;

    console.log( `flash nicolive player detected.` )
}


// アドオンをリロードしたときにbackground-scriptのロードより先に来てしまうので適当に待つ
setTimeout( () =>{
    let sending = browser.runtime.sendMessage( {
        cmd: 'put-liveinfo',
        liveinfo: data
    } );

    sending.then( ( success ) =>{
    }, ( failed ) =>{
        console.log( failed );
    } );
}, 100 );

