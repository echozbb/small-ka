const expect = require('chai').expect;
const ppr = require ('./preprocessor');

describe('Preprocessing', function () {
    var input;        
    var output;
    // JSON
    it('json', function  () {
        input = '{"a":"$100-200"}';
        output = '{"a":"$100-200"}';
        expect(ppr.preprocess(input)).to.eql(output);
    });
    // ACTION
    it('action', function  () {
        input = "action? $100-200";
        output = "action? $100-200";
        expect(ppr.preprocess(input)).to.eql(output);
    });
    // CASH
    it('cash', function  () {
        input = '$100-200';
        output = '$100 $200';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '预算200-300';
        output = '$200 $300';
        expect(ppr.preprocess(input)).to.eql(output);
    });
    // DATE
    it('date', function  () {
        input = '10Oct2018 - 20Oct2018';
        output = '2018.10.10-2018.10.20';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '5.20  - 5.22';
        output = '2018.5.20-2018.5.22';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '2018年6月1日 - 2018年6月3日';
        output = '2018.6.1-2018.6.3';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '18.2.2 - 18.2.3';
        output = '2018.2.2-2018.2.3';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '2月12-14日';
        output = '2018.2.12-2018.2.14';
        expect(ppr.preprocess(input)).to.eql(output);

        input = '2月12到14日';
        output = '2018.2.12-2018.2.14';
        expect(ppr.preprocess(input)).to.eql(output);

        //input ='1120入住 1123离开';
        //output = ''
    });
    // Combined
    it('combined', function  () {
        input = '200澳币一晚';
        output = '$200 1晚';
        expect(ppr.preprocess(input)).to.eql(output);
    });

})