// ==UserScript==
// @name         Shopee Calculator
// @namespace    http://violentmonkey.net/
// @version      1.0
// @description  Calculates your total spent on your Shopee orders
// @match        https://shopee.com.my/*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    let totalSpent = 0;
    let orderCount = 0;
    const datacsv = [['Order No.', 'Amount (RM)', 'Product Name']];

    async function calculate(next) {
        const opts = {
            method: 'GET',
            headers: {}
        };

        try {
            const response = await fetch('https://shopee.com.my/api/v4/order/get_order_list?limit=5&list_type=3&offset=' + next, opts);
            const body = await response.json();
            const nextOffset = body.data.next_offset;

            if (nextOffset >= 0) {
                for (const [key, value] of Object.entries(body.data.details_list)) {
                    const totalTemp = value.info_card.final_total / 100000;
                    totalSpent += totalTemp;
                    datacsv.push([orderCount + 1, totalTemp.toFixed(2), value.info_card.order_list_cards[0].product_info.item_groups[0].items[0].name]);
                    orderCount++;
                    console.log(`${orderCount}: RM ${totalTemp.toFixed(2)} - ${value.info_card.order_list_cards[0].product_info.item_groups[0].items[0].name}`);
                }
                await calculate(nextOffset);
            } else {
                exportToCsv('shopee_orders.csv', datacsv);
                console.log('Calculation completed!');
                console.log(`GRAND TOTAL: RM ${totalSpent.toFixed(2)}`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function exportToCsv(filename, rows) {
        const processRow = row => row.map(value => value.toString().replace(/"/g, '""')).join(',') + '\n';
        const csvFile = rows.map(processRow).join('');
        const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });

        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    await calculate(0);
})();
