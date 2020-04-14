var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var sponsorshipSchema = new Schema({
    banner: {
        type: Buffer,
        required: 'Kindly add the banner of the sponsorship',
        unique: true
    },
    link: {
        type: String,
        required: 'Kindly add the link of the sponsorship'
    },
    sponsor: {
        type: Schema.Types.ObjectId,
        required: 'Kindly add the sponsor who owns the sponsorship'
    },
    tripSponsorships: [{
        trip: {
            type: String,
            //This validation does not run after middleware pre-save
            validate: {
                validator: function(v) {
                    return /\d{6}-[A-Z]{4}/.test(v);
                },
                message: 'ticker is not valid!, Pattern("\d(6)-[A-Z](4)")'
            }
        },
        paid: {
            type: Boolean,
            default: false
        }
    }]
});

/*sponsorshipSchema.pre('save', function(callback) {
    callback();
});*/

sponsorshipSchema.index({sponsor: 1});

module.exports = mongoose.model('Sponsorships', sponsorshipSchema);