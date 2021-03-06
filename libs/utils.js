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
 *
 * @param ch
 * @returns {string|XML|*}
 */
function htmlspecialchars( ch ){
    ch = ch.replace( /&/g, "&amp;" );
    ch = ch.replace( /"/g, "&quot;" );
    //ch = ch.replace(/'/g,"&#039;");
    ch = ch.replace( /</g, "&lt;" );
    ch = ch.replace( />/g, "&gt;" );
    return ch;
}

/**
 *
 * @param ch
 * @returns {string|XML|*}
 */
function restorehtmlspecialchars( ch ){
    ch = ch.replace( /&quot;/g, "\"" );
    ch = ch.replace( /&amp;/g, "&" );
    ch = ch.replace( /&lt;/g, "<" );
    ch = ch.replace( /&gt;/g, ">" );
    ch = ch.replace( /&nbsp;/g, " " );
    ch = ch.replace( /&apos;/g, "'" );
    return ch;
}

/**
 * オブジェクトをマージする.
 * @param a オブジェクト1
 * @param b オブジェクト2
 * @return aにbをマージしたオブジェクトを返す
 */
function MergeSimpleObject( a, b ){
    for( let k in b ){
        if( 'object' == typeof a[k] ){
            a[k] = MergeSimpleObject( a[k], b[k] );
        }else{
            a[k] = b[k];
        }
    }
    return a;
}

/**
 * min以上、max以下の範囲で乱数を返す.
 * @param min
 * @param max
 * @returns {*}
 * @constructor
 */
function GetRandomInt( min, max ){
    return Math.floor( Math.random() * (max - min + 1) ) + min;
}


// LCGの疑似乱数はランダム再生専用のため、他の用途では使用禁止.
let g_randomseed = GetCurrentTime();

function srand( seed ){
    g_randomseed = seed;
}

function rand(){
    g_randomseed = (g_randomseed * 214013 + 2531011) & 0x7fffffff;
    return g_randomseed;
}

// min以上、max以下の範囲で乱数を返す.
function GetRandomIntLCG( min, max ){
    let tmp = rand() >> 4;
    return (tmp % (max - min + 1)) + min;
}


function Deg2Rad( deg ){
    return Math.PI * (deg / 180);
}


/**
 *  現在時刻を秒で返す(UNIX時間).
 */
function GetCurrentTime(){
    let d = new Date();
    return Math.floor( d.getTime() / 1000 );
}

function GetDateString( ms, full ){
    let d = new Date( ms );
    if( full ){
        // return d.toLocaleFormat( "%Y/%m/%d %H:%M:%S" );
        return d.toLocaleString( 'ja-JP' );
    }
    // return d.toLocaleFormat( "%m/%d %H:%M:%S" );
    return d.toLocaleString( 'ja-JP' ).substring( 5 );
}

/**
 * 指定日時を H:M:S で返す.
 * @param format
 * @param ms
 * @returns {string}
 * @constructor
 */
function GetDateTimeString( ms ){
    let d = new Date( ms );
    let tmp = d.toLocaleString( 'ja-JP' );
    return tmp.substring( tmp.indexOf( ' ' ) + 1 );
}


function GetFormattedDateString( format, ms ){
    let d = new Date( ms );
    return d.toLocaleFormat( format );
}

// hour:min:sec の文字列を返す.
function GetTimeString( sec ){
    sec = Math.abs( sec );

    let hour = parseInt( sec / 60 / 60 );
    let min = parseInt( sec / 60 ) - hour * 60;
    let s = parseInt( sec % 60 );

    let str = hour < 10 ? "0" + hour : hour;
    str += ":";
    str += min < 10 ? "0" + min : min;
    str += ":";
    str += s < 10 ? "0" + s : s;
    return str;
}

/**
 * 現在日時をYYYYMMDDHHMMSSssssの文字列で返す.
 * @returns {string}
 */
function GetNowDateString(){
    let d = new Date();
    let month = d.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    let date = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
    let hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
    let min = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
    let sec = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
    let ms = d.getMilliseconds();
    if( ms < 10 ){
        ms = "000" + ms;
    }else if( ms < 100 ){
        ms = "00" + ms;
    }else if( ms < 1000 ){
        ms = "0" + ms;
    }
    return "" + d.getFullYear() + month + date + hour + min + sec + ms;
}


/**
 * 符号付き数字を返す
 */
function GetSignedValue( v ){
    if( v > 0 ) return `+${v}`;
    return v;
}


/**
 * 配列をシャッフルする.
 * @param list 配列
 */
function ShuffleArray( list ){
    let i = list.length;
    while( i ){
        let j = Math.floor( Math.random() * i );
        let t = list[--i];
        list[i] = list[j];
        list[j] = t;
    }
}


/**
 * 配列の要素同士で入れ替えをする.
 * @param arr
 * @param n1
 * @param n2
 * @constructor
 */
function SwapArrayElements( arr, n1, n2 ){
    let tmp = arr[n1];
    arr[n1] = arr[n2];
    arr[n2] = tmp;
}


function GetParameterByName( name, url ){
    if( !url ) url = window.location.href;
    name = name.replace( /[\[\]]/g, "\\$&" );
    let regex   = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
        results = regex.exec( url );
    if( !results ) return null;
    if( !results[2] ) return '';
    return decodeURIComponent( results[2].replace( /\+/g, " " ) );
}

/**
 * @param method GET or POST
 * @param uri URI
 * @param substitution 使用するセッションクッキーを指定(任意)
 */
function CreateXHR( method, uri, substitution ){
    let req = new XMLHttpRequest();
    if( !req ) return null;
    req.open( method, uri );
    req.timeout = 30 * 1000; // 30sec timeout for Gecko 12.0+
    return req;
}


// 特定の DOM ノードもしくは Document オブジェクト (aNode) に対して
// XPath 式 aExpression を評価し、その結果を配列として返す。
function EvaluateXPath( aNode, aExpr ){
    let xpe = new XPathEvaluator();
    let nsResolver = xpe.createNSResolver( aNode.ownerDocument == null ?
        aNode.documentElement : aNode.ownerDocument.documentElement );
    let result = xpe.evaluate( aExpr, aNode, nsResolver, 0, null );
    let found = [];
    let res;
    while( res = result.iterateNext() )
        found.push( res );
    return found;
}

/**
 * XMLから指定のXPathの要素のテキストを返す.
 * @param xml
 * @param path
 * @returns {*}
 */
function GetXmlText( xml, path ){
    try{
        let tmp = EvaluateXPath( xml, path );
        if( tmp.length <= 0 ) return null;
        return tmp[0].textContent;
    }catch( x ){
        console.log( x );
        return null;
    }
}


/**
 * 指定の要素を削除する.
 * @param elem 削除したい要素
 */
function RemoveElement( elem ){
    if( elem ){
        elem.parentNode.removeChild( elem );
    }
}

/**
 * 指定の要素の子要素を全削除する.
 * @param elem 対象の要素
 */
function RemoveChildren( elem ){
    while( elem.hasChildNodes() ){
        elem.removeChild( elem.childNodes[0] );
    }
}


/**
 * 指定タグを持つ親要素を探す.
 * @param elem 検索の起点となる要素
 * @param tag 親要素で探したいタグ名
 */
function FindParentElement( elem, tag ){
    //debugprint("Element:"+elem+" Tag:"+tag);
    while( elem.parentNode &&
    (!elem.tagName || (elem.tagName.toUpperCase() != tag.toUpperCase())) ){
        elem = elem.parentNode;
    }
    return elem;
}


/**
 * 全角文字を半角文字にする
 * @param str
 * @returns {string|XML|void|*}
 */
function ZenToHan( str ){
    return str.replace( /[ａ-ｚＡ-Ｚ０-９－（）＠]/g,
        function( s ){
            return String.fromCharCode( s.charCodeAt( 0 ) - 65248 );
        } );
}

/**
 * ひらがなをカタカナにする
 * @param str
 * @returns {string|XML|void|*}
 */
function HiraToKana( str ){
    return str.replace( /[\u3041-\u3094]/g,
        function( s ){
            return String.fromCharCode( s.charCodeAt( 0 ) + 0x60 );
        } );
}

/**
 * 3桁ごとにカンマを打つ
 * @param str
 * @returns {*}
 */
function FormatCommas( str ){
    try{
        return str.toString().replace( /(\d)(?=(?:\d{3})+$)/g, "$1," );
    }catch( x ){
        return str;
    }
}

/*--- WebExtensions固有のもの ---*/

/**
 * テキストデータをファイルに保存する
 * @param name ファイル名
 * @param text テキスト
 * @constructor
 */
function SaveText( name, text ){
    // Aタグの download 属性でDLできないので仕方なくこちらを使う.
    let blob = new Blob( [text], {type: "text/plain"} );
    let dl = window.URL.createObjectURL( blob );
    browser.downloads.download( {
        url: dl,
        filename: name,
        saveAs: true,
    } ).then( ( id ) =>{
        console.log( `download: ${id}` )
    }, ( err ) =>{
        console.log( 'download failed.' );
    } );
}


function OpenLink( url ){
    let link = document.createElement( 'a' );
    link.setAttribute( 'target', '_blank' );
    link.setAttribute( 'href', url );

    document.body.appendChild( link );
    link.click();
    document.body.removeChild( link );
}


//----------------------------------------------------------------------

function DebugLog( text ){
    let t = $( '#debug' ).val();
    t += text + "\n";
    $( '#debug' ).val( t );
}


function CopyToClipboard( text ){
    // console.log( text );
    let textarea = document.createElement( 'textarea' );

    document.body.appendChild( textarea );
    $( textarea ).val( text );
    textarea.select();
    document.execCommand( "Copy" );
    document.body.removeChild( textarea );
}


function OpenWindow( url, w, h ){
    let mainURL = browser.extension.getURL( url );
    let creating = browser.windows.create( {
        url: mainURL,
        type: "panel",
        width: w,
        height: h
    } );
    creating.then(
        ( windowInfo ) =>{
            console.log( `Created window: ${windowInfo.id}` );
        },
        ( error ) =>{
            console.log( `create window Error: ${error}` );
        } );
}


/**
 * 通知を表示する.
 * @param title
 * @param text
 */
function Notification( title, text ){
    browser.notifications.create( {
        "type": "basic",
        "iconUrl": browser.extension.getURL( "/icons/icon-48.png" ),
        "title": title,
        "message": text
    } );
}
