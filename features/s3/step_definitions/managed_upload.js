module.exports = function () {
  this.Before("@s3", "@managed_upload", function (callback) {

    // execute only once
    if (this.mgrBucket) {
      callback();
      return;
    }

    this.mgrBucket = this.uniqueName('aws-sdk-js-integration');
    this.s3.createBucket({Bucket:this.mgrBucket}, callback);
  });

  this.AfterAll(function (callback) {
    var self = this;
    this.s3.listObjects({Bucket:this.mgrBucket}, function(err, data) {
      data.Contents.forEach(function(object) {
        self.s3.deleteObject({Bucket:self.mgrBucket,Key:object.Key}).send();
      });
      setTimeout(function() {
        self.s3.deleteBucket({Bucket:self.mgrBucket}, callback);
      }, 1000);
    });
  });

  this.When(/^I use S3 managed upload to upload a large buffer$/, function (callback) {
    var self = this;
    var buffer = new Buffer(1024 * 1024 * 12);
    var params = {Bucket: self.mgrBucket, Key: 'largebuffer', Body: buffer};
    self.s3.upload().send(params, function (err, data) {
      self.error = err;
      self.data = data;
      callback();
    });
  });

  this.Then(/^the multipart upload should succeed$/, function (callback) {
    this.assert.equal(this.error, null);
    this.assert.equal(typeof this.data.Location, 'string');
    callback();
  });

  this.When(/^I use S3 managed upload to upload a large stream$/, function (callback) {
    var self = this;
    var stream = this.AWS.util.buffer.toStream(new Buffer(1024 * 1024 * 12));
    var params = {Bucket: self.mgrBucket, Key: 'largestream', Body: stream};
    self.s3.upload().send(params, function (err, data) {
      self.error = err;
      self.data = data;
      callback();
    });
  });
};
