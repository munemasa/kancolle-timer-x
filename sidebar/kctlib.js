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
 * 指定の遠征の名前を返す
 * @param mission_ids{Array}
 * @returns {Promise.<*>}
 */
async function GetMissionName( mission_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-mission-name',
        missions: mission_ids
    } );
    return result;
}

/**
 * 艦娘名を取得する
 * @param ship_ids{Array}
 * @returns {Promise<*>}
 */
async function GetShipName( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-name',
        ids: ship_ids
    } );
    return result;
}

/**
 * 艦娘IDから名前を取得する
 * @param ship_ids
 * @returns {Promise<*>}
 */
async function GetShipNameFromId( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-name-from-id',
        ids: ship_ids
    } );
    return result;
}

/**
 * 艦娘のスペックを取得する
 * @param ship_ids
 * @returns {Promise<*>}
 */
async function GetShipSpecs( ship_ids ){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-ship-specs',
        ids: ship_ids
    } );
    return result;
}

/**
 * 全艦娘のスペックを取得する
 * @returns {Promise<*>}
 */
async function GetAllShipSpecs(){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-all-ship-specs'
    } );
    return result;
}

/**
 * 被害艦娘を取得する
 * @returns {Promise<*>}
 */
async function GetAllDamagedShipSpecs(){
    let result = await browser.runtime.sendMessage( {
        cmd: 'get-all-damaged-ship-specs'
    } );
    return result;
}

