//var capturing = browser.tabs.captureVisibleTab();


let Popup = {

    openWindow: function( url ){
        let mainURL = browser.extension.getURL( url );
        let creating = browser.windows.create( {
            url: mainURL,
            type: "panel",
            width: 640,
            height: 480
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
            canvas.width = 800;
            canvas.height = 480;

            let ctx = canvas.getContext( "2d" );
            ctx.clearRect( 0, 0, canvas.width, canvas.height );
            ctx.save();
            ctx.scale( 1.0, 1.0 );
            ctx.drawImage( image, 0, 0, 800, 480, 0, 0, 800, 480 );

            ctx.restore();
            // TODO 提督名マスクを入れる

            if( 1 ){
                let dt = canvas.toDataURL( 'image/png' );
                dt = dt.replace( /^data:image\/[^;]*/, 'data:application/octet-stream' );

                let date = new Date();
                let a = document.createElement( 'a' );
                a.href = dt;
                a.download = `screenshot-${this.getNowDateString()}.png`;
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

    init: function(){
        document.querySelector( '#take-screenshot' ).addEventListener( 'click', ( ev ) =>{
            ev.preventDefault();
            ev.stopPropagation();
            Popup.captureScreenshot();
        } );

        document.querySelector( '#take-fleet-screenshot' ).addEventListener( 'click', ( ev ) =>{
            this.openWindow( '../windows/ss_organization.html' );
        } );

        document.querySelector( '#open-settings' ).addEventListener( 'click', ( ev ) =>{
            browser.runtime.openOptionsPage();
            window.close();
        } );
    }
};


window.addEventListener( 'load', ( ev ) =>{
    Popup.init();
} );
