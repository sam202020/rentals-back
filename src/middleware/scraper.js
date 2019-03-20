const cheerio = require('cheerio')
const rp = require('request-promise');

const options = {
    uri: `https://www.apartments.com/lakewood-nj/`,
    transform: function (body) {
      return cheerio.load(body);
    }
  };

export default getDefaultApartments = options => {
  rp(options)
  .then(($) => {
    // console.log($('.placardTitle').text())
    // console.log($('.altRentDisplay'))
    // console.log($('.phone'))
    $(".placardTitle" ).each(function( index ) {
        console.log( index + ": " + $( this ).text() );
      });
  })
  .catch((err) => {
    console.log(err);
  });
};
