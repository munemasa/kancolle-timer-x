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


let Popup = {

    getNowDateString: function(){
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

    captureScreenshot: async function(){
        // TODO あちこちに散らばったスクショコードは整理したい
        let zoom = await browser.tabs.getZoom();
        let ss = await browser.tabs.captureVisibleTab();

        let image = new Image();
        image.onload = ( ev ) =>{
            let canvas = document.createElement( 'canvas' );
            let w = this._ss_flash_position.w * zoom;
            let h = this._ss_flash_position.h * zoom;
            canvas.width = w;
            canvas.height = h;

            let ctx = canvas.getContext( "2d" );
            ctx.clearRect( 0, 0, canvas.width, canvas.height );
            ctx.save();
            ctx.scale( 1.0, 1.0 );

            let x = this._ss_game_position.offset_x + this._ss_flash_position.offset_x - this._ss_game_position.scroll_x;
            let y = this._ss_game_position.offset_y + this._ss_flash_position.offset_y - this._ss_game_position.scroll_y;
            x *= zoom;
            y *= zoom;
            ctx.drawImage( image, x, y, w, h, 0, 0, w, h );

            ctx.restore();
            // TODO 提督名マスクを入れる

            if( 1 ){
                let is_jpeg = this.config && this.config['ss-format-jpeg'];
                let dt = canvas.toDataURL( is_jpeg ? 'image/jpeg' : 'image/png' );
                dt = dt.replace( /^data:image\/[^;]*/, 'data:application/octet-stream' );

                let date = new Date();
                let a = document.createElement( 'a' );
                a.href = dt;
                a.download = `screenshot-${this.getNowDateString()}.${is_jpeg ? 'jpg' : 'png'}`;
                document.body.appendChild( a );
                a.click();
            }else{
                // こちらの方法で保存したいけどできないのは、ポップアップウィンドウが閉じてしまってblobオブジェクトがなくなるから
                let dt = canvas.toDataURL( 'image/png' );
                dt = dt.replace( /^data:image\/[^;]*/, 'data:application/octet-stream' );

                let bin = atob( dt.split( ',' )[1] );
                let ab = new ArrayBuffer( bin.length );
                let ia = new Uint8Array( ab );
                for( let i = 0; i < bin.length; i++ ){
                    ia[i] = bin.charCodeAt( i );
                }

                let name = `screenshot-${this.getNowDateString()}.png`;
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
            }
        };
        image.src = ss;
    },

    loadData: async function(){
        let result = await browser.storage.local.get( 'basic' );
        if( result && result.basic ){
            let basic = result.basic;

            document.querySelector( '#num-ships' ).textContent = `${basic._cur_ships}/${basic.api_max_chara}`;
            document.querySelector( '#num-slotitem' ).textContent = `${basic._cur_slotitem}/${basic.api_max_slotitem}`;
        }

        result = await browser.storage.local.get( 'kct_config' );
        this.config = result.kct_config;

        let bg = await browser.runtime.getBackgroundPage();
        let KanColle = bg.GetKanColle();

        this._ss_game_position = KanColle._ss_game_position;
        this._ss_flash_position = KanColle._ss_flash_position;
    },

    init: function(){
        this.loadData();

        document.querySelector( '#take-screenshot' ).addEventListener( 'click', ( ev ) =>{
            Popup.captureScreenshot();
        } );

        document.querySelector( '#take-fleet-screenshot' ).addEventListener( 'click', ( ev ) =>{
            OpenWindow( '../windows/ss_organization.html', 640, 480 );
        } );

        document.querySelector( '#open-shiplist' ).addEventListener( 'click', ( ev ) =>{
            OpenWindow( '../windows/shiplist.html', 800, 512 );
        } );

        document.querySelector( '#open-equipmentlist' ).addEventListener( 'click', ( ev ) =>{
            OpenWindow( '../windows/equipmentlist.html', 640, 480 );
        } );

        document.querySelector( '#open-resource-graph' ).addEventListener( 'click', ( ev ) =>{
            OpenWindow( '../windows/resourcegraph.html', 840, 532 );
        } );

        document.querySelector( '#open-settings' ).addEventListener( 'click', ( ev ) =>{
            browser.runtime.openOptionsPage();
            window.close();
        } );

        document.querySelector( '#open-kct-window' ).addEventListener( 'click', ( ev ) =>{
            OpenWindow( '../sidebar/sidebar.html', 272, 480 );
            window.close();
        } );
    }
};


window.addEventListener( 'load', ( ev ) =>{
    Popup.init();
} );
