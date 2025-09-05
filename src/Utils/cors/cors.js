


export function corsOptions() {        
    const whitelist = process.env.WHITELIST.split(',');
    const corsOptions = {
  origin: function (origin, callback) {
    if( !origin ){
        return callback(null, true);
    }
    if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
    } else {
        callback(new Error('Not allowed by CORS'))
    }
  }
}
    return corsOptions;
}