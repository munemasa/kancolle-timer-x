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

let Powerup = {
    _file: "chrome://kancolletimer/content/data/powerup.tsv",
    _url: 'https://docs.google.com/spreadsheets/d/1UOo5VpFZF-Ee_NUZ2T_ECMBajfIaIUkIs9xVYBkPcv4/export?format=tsv&id=1UOo5VpFZF-Ee_NUZ2T_ECMBajfIaIUkIs9xVYBkPcv4&gid=1529761687',

    _data: null,

    parse: function( text ){
        this._data = [];
        let rows = text.split( /\r\n|\n|\r/ );

        let flg = false;
        for( let row of rows ){
            if( !flg ){
                // 1行目にはヘッダがあるだけなのでスキップ
                flg = true;
                continue;
            }
            let tmp = row.split( /\t/ );
            this._data.push( tmp );
        }
    },

    expand: function(){
        let elems = document.getElementsByClassName( 'on-off' );
        for( let elem of elems ){
            elem.checked = true;
        }
    },
    collapse: function(){
        let elems = document.getElementsByClassName( 'on-off' );
        for( let elem of elems ){
            elem.checked = false;
        }
    },

    today: function(){
        let now = new Date();
        $( 'calendar' ).value = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
        this.createView();
    },

    createView: function(){
        let date = new Date(); //$( 'calendar' ).dateValue;
        let dayofweek = date.getDay();

        let pickup = {};
        for( let row of this._data ){
            if( row[dayofweek + 1] ){
                let equip_name = row[0];
                let ship_name = row[8];

                if( !pickup[equip_name] ){
                    pickup[equip_name] = [];
                }
                pickup[equip_name].push( ship_name );
            }
        }

        let body = document.querySelector( '#body' );
        RemoveChildren( body );

        let cnt = 0;
        for( let k in pickup ){
            let row = pickup[k];

            let label = document.createElement( 'label' );
            label.setAttribute( 'class', 'equip-name' );
            label.setAttribute( 'for', '_' + cnt );
            label.appendChild( document.createTextNode( k ) );

            let checkbox = document.createElement( 'input' );
            checkbox.setAttribute( 'type', 'checkbox' );
            checkbox.setAttribute( 'id', '_' + cnt );
            checkbox.setAttribute( 'class', 'on-off' );

            let description = document.createElement( 'div' );
            description.setAttribute( 'class', 'description' );

            for( let shipname of row ){
                let name = document.createElement( 'li' );
                name.appendChild( document.createTextNode( shipname || "---" ) );
                description.appendChild( name );
            }

            body.appendChild( label );
            body.appendChild( checkbox );
            body.appendChild( description );

            cnt++;
        }
    },

    readFile: function(){
        let req = new XMLHttpRequest();
        if( !req ) return;

        req.open( 'GET', this._url );
        req.responseType = "text";

        req.onreadystatechange = function(){
            if( req.readyState == 4 && req.status == 200 ){
                let txt = req.responseText;
                Powerup.parse( txt );
                Powerup.createView();
            }
        };

        req.send( "" );
    },

    init: function(){
        this.readFile();
    }

};

window.addEventListener( "load", function( e ){
    Powerup.init();
}, false );
