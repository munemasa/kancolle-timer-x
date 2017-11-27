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

let ScreenShotOrganization = {
    _cnt: 0,
    canvas: null,
    w: 453,
    h: 365,

    row: 2,
    col: 3,

    getScreenshot: async function(){
        let canvas = this.canvas;

        let ss = await browser.tabs.captureVisibleTab( ScreenShotOrganization.windowId );
        let cnt = ScreenShotOrganization._cnt;

        let ctx = canvas.getContext( '2d' );
        let img = new Image();
        img.onload = function(){
            let w = 453;
            let h = 365;
            let base_x = 330;
            let base_y = 103;

            let x = (cnt % ScreenShotOrganization.col) * w;
            let y = parseInt( cnt / ScreenShotOrganization.col ) * h;

            ctx.drawImage( img, base_x, base_y, w, h, x, y, w, h );

            ScreenShotOrganization._cnt++;
            ScreenShotOrganization._cnt %= 6;
            document.querySelector( '#text' ).textContent = (ScreenShotOrganization._cnt + 1) + "枚目を撮影してください。";

            let url = canvas.toDataURL( "image/png" );
            document.querySelector( '#picture' ).src = url;
        };
        img.src = ss;
    },

    changeColumns: function( n ){
        let width = this.w * n;
        let height = this.h * parseInt( 6 / n + 0.999 );
        this.canvas.width = width;
        this.canvas.height = height;
        document.querySelector( '#picture' ).width = width / 2;
        document.querySelector( '#picture' ).height = height / 2;
        this.col = n;

        this._cnt = 0;
        document.querySelector( '#text' ).value = "1枚目を撮影してください。";
    },

    tweet: function(){
        let url = CanvasToURI( this.canvas, KanColleTimerConfig.getBool( "screenshot.jpeg" ) ? "image/jpeg" : "image/png" );
        OpenTweetDialog( true, url );
    },

    getNowDateString: function(){
        // TODO 複数箇所に散らばっているのをまとめる
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
    },


    createBlob: function( dataURI, name, callback ){
        let byteString = atob( dataURI.split( ',' )[1] );
        let mimeString = dataURI.split( ',' )[0].split( ':' )[1].split( ';' )[0];
        let ab = new ArrayBuffer( byteString.length );
        let ia = new Uint8Array( ab );
        for( let i = 0; i < byteString.length; i++ ){
            ia[i] = byteString.charCodeAt( i );
        }

        let blob = new Blob( [ab], {type: mimeString} );
        callback( blob.size );
    },

    save: function(){
        let dt = this.canvas.toDataURL( 'image/png' );
        dt = dt.replace( /^data:image\/[^;]*/, 'data:application/octet-stream' );

        // Aタグの download 属性でDLできないので仕方なくこちらを使う.
        let bin = atob( dt.split( ',' )[1] );
        let ab = new ArrayBuffer( bin.length );
        let ia = new Uint8Array( ab );
        for( let i = 0; i < bin.length; i++ ){
            ia[i] = bin.charCodeAt( i );
        }

        let name = `screenshot-fleet-${this.getNowDateString()}.png`;
        let blob = new Blob( [ab], {type: "application/octet-stream"} );
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
    },

    init: function(){
        let getting = browser.windows.getAll( {
            populate: true,
            windowTypes: ["normal"]
        } );
        getting.then( ( win ) =>{
            console.log( win );

            for( let w of win ){
                for( let tab of w.tabs ){
                    // http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/
                    if( tab.url.match( /app_id=854854/ ) ){
                        ScreenShotOrganization.windowId = tab.windowId;
                    }
                }
            }
        }, ( e ) =>{
            console.log( e );
        } );


        this.canvas = document.createElement( "canvas" );
        this.canvas.style.display = "inline";
        this.canvas.width = 1360;
        this.canvas.height = 730;

        this.changeColumns( parseInt( document.querySelector( '#columns' ).value ) );

        document.querySelector( '#columns' ).addEventListener( 'change', ( ev ) =>{
            ScreenShotOrganization.changeColumns( parseInt( document.querySelector( '#columns' ).value ) );
        } );

        document.querySelector( '#take-ss' ).addEventListener( 'click', ( ev ) =>{
            ScreenShotOrganization.getScreenshot();
        } );
        document.querySelector( '#save-ss' ).addEventListener( 'click', ( ev ) =>{
            ScreenShotOrganization.save();
        } );
    }

};

window.addEventListener( "load", function( e ){
    ScreenShotOrganization.init();
}, false );