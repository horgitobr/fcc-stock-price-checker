'use strict';

const stockLikes = {};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {

      try {

        const stockQuery = req.query.stock;
        const like = req.query.like === 'true';

        // normalizo/anonymize IP
        const userIp = req.ip
          .replace('::ffff:', '')
          .replace(/:\d+$/, '');

        async function getStockData(stock) {

          stock = stock.toUpperCase();

          const response = await fetch(
            `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
          );

          const data = await response.json();

          // krijo stock në memory nëse nuk ekziston
          if (!stockLikes[stock]) {
            stockLikes[stock] = {
              likes: 0,
              ips: []
            };
          }

          // vetëm 1 like per IP
          if (like && !stockLikes[stock].ips.includes(userIp)) {
            stockLikes[stock].likes++;
            stockLikes[stock].ips.push(userIp);
          }


          return {
            stock: data.symbol,
            price: data.latestPrice,
            likes: stockLikes[stock].likes
          };
        }

        // 2 stocks
        if (Array.isArray(stockQuery)) {

          const stock1 = await getStockData(stockQuery[0]);
          const stock2 = await getStockData(stockQuery[1]);

          return res.json({
            stockData: [
              {
                stock: stock1.stock,
                price: stock1.price,
                rel_likes: stock1.likes - stock2.likes
              },
              {
                stock: stock2.stock,
                price: stock2.price,
                rel_likes: stock2.likes - stock1.likes
              }
            ]
          });
        }

        // 1 stock
        const stockData = await getStockData(stockQuery);

        return res.json({
          stockData
        });

      } catch (error) {

        console.error(error);

        return res.json({
          error: 'Unable to fetch stock data'
        });

      }

    });

};