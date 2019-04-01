const cheerio = require('cheerio')
const rp = require('request-promise');
const fs = require('fs')

let obj = {
  table: []
}

const options = {
    uri: `https://www.apartments.com/lakewood-nj/`,
    transform: function (body) {
      return cheerio.load(body);
    }
  };
  rp(options)
  .then(($) => {
  $(".placardTitle" ).each(function( index ) {
    console.log( index + ": " + $( this ).text() );
    var place = $( this ).text();
    var strippedPlace = place.substring(1);
    obj.table.push({'type': 'apartment', 'place': strippedPlace})
  });
  $(".altRentDisplay" ).each(function( index ) {
    console.log( index + ": " + $( this ).text() );
    obj.table[index]['price'] = $( this ).text();
  });
  $(".unitLabel" ).each(function( index ) {
    console.log( index + ": " + $( this ).text() );
    var beds = $( this ).text();
    var strippedBeds = beds.replace(/[^0-9\-]/g,'');
    obj.table[index]['bedrooms'] = strippedBeds;
  });
  $(".phone" ).each(function( index ) {
    console.log( index + ": " + $( this ).text() );
    var string = $( this ).text();
    var stripped = string.replace(/[^0-9\-]/g,'');
    obj.table[index]['phone'] = stripped;
  });
}).then(()=>{
  var json = JSON.stringify(obj);
  fs.writeFile('myjsonfile.json', json, 'utf8', callback);
})
.catch((err) => {
  console.log(err);
});

const callback = () => {
  console.log('hello')
};


  


