var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var ActorSchema = new Schema({
    name: {
        type: String,
        required: 'Kindly enter the name of the actor'
    },
    surname:  {
        type: String,
        required: 'Kindly enter the surname of the actor'
    },
    email:  {
        type: String,
        required: 'Kindly enter the email of the actor',
        unique: true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password:{
        type: String,
        minlength: 5,
        required: true
    },
    
    //address, language and phone are not mandatory therefore, they are not required
    address:  {
        type: String,
    },
    language:  {
        type: String,
        default: 'en'
    },

    phone:  {
        type: String,
    },
    
    //all actors are not validated initially, only an admin can modify this property to validate or invalidate an actor:
    validated: {
        type: Boolean,
        default:false
    },
    role:{
        type: String,
        required: 'Kindly enter the role(s) of the actor',
        enum: ['EXPLORER', 'MANAGER', 'ADMINISTRATOR', 'SPONSOR']
    },
    createdAt:{
        type: Date,
        default: Date.now
    }, 
    customToken: {
        type: String
      }

}, {strict:false});



ActorSchema.pre('save', function(callback) {
    var actor = this;
    
    if (!actor.isModified('password')) return callback();
  
    bcrypt.genSalt(5, function(err, salt) {
      if (err) return callback(err);
  
      bcrypt.hash(actor.password, salt, function(err, hash) {
        if (err) return callback(err);
        actor.password = hash;
        callback();
      });
    });
});

ActorSchema.methods.verifyPassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
    console.log('verifying password in actorModel: '+password);
    if (err) return cb(err);
    console.log('iMatch: '+isMatch);
    cb(null, isMatch);
  });

  
};

//indice de los actores segun el email:
ActorSchema.index({email:1});

//indice de los actores que solo esten baneados (validated=false):
ActorSchema.index({validated:1},{ partialFilterExpression: {$eq:false}});

//ActorSchema.index({"email": 1}, {unique: true});

module.exports = mongoose.model('Actors', ActorSchema)
