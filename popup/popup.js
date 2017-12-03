//var capturing = browser.tabs.captureVisibleTab();


let Popup = {

    openWindow: function( url, w, h ){
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
    },

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
        let ss = await browser.tabs.captureVisibleTab();

        let image = new Image();
        image.onload = ( ev ) =>{
            let canvas = document.createElement( 'canvas' );
            let w = this._ss_flash_position.w;
            let h = this._ss_flash_position.h;
            canvas.width = w;
            canvas.height = h;

            let ctx = canvas.getContext( "2d" );
            ctx.clearRect( 0, 0, canvas.width, canvas.height );
            ctx.save();
            ctx.scale( 1.0, 1.0 );

            let x = this._ss_game_position.offset_x + this._ss_flash_position.offset_x - this._ss_game_position.scroll_x;
            let y = this._ss_game_position.offset_y + this._ss_flash_position.offset_y - this._ss_game_position.scroll_y;
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
            this.openWindow( '../windows/ss_organization.html', 640, 480 );
        } );

        document.querySelector( '#open-shiplist' ).addEventListener( 'click', ( ev ) =>{
            this.openWindow( '../windows/shiplist.html', 800, 512 );
        } );

        document.querySelector( '#open-settings' ).addEventListener( 'click', ( ev ) =>{
            browser.runtime.openOptionsPage();
            window.close();
        } );

        document.querySelector( '#open-kct-window' ).addEventListener( 'click', ( ev ) =>{
            this.openWindow( '../sidebar/sidebar.html', 272, 480 );
            window.close();
        } );
    }
};


window.addEventListener( 'load', ( ev ) =>{
    Popup.init();
} );
