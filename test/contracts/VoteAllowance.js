let VoteAllowance = artifacts.require("VoteAllowance");

let assertThrowsAsync = async (fn, regExp) => {
    let f = () => {};
    try {
        await fn();
    } catch(e) {
        f = () => {throw e};
    } finally {
        assert.throws(f, regExp);
    }
};

contract('VoteAllowance', function (accounts) {
    let allowance;
    let netvote;
    let accountOwner;
    let election;
    let notAdmin;
    let invalidElection;

    beforeEach(async () => {
        netvote = accounts[0];
        accountOwner = accounts[1];
        election = accounts[2];
        invalidElection = accounts[3];
        notAdmin = accounts[4];
        allowance = await VoteAllowance.new({from: netvote});
        await allowance.addVotes(accountOwner, 10, {from: netvote})
    });

    it("should start with 10 votes", async function () {
        let votes = await allowance.allowance(accountOwner);
        assert.equal(votes, 10, "should have 10 votes");
    });

    it("should allow election to transact", async function () {
        await allowance.addElection(election, {from: accountOwner});
        let allowed = await allowance.electionIsAllowed(accountOwner, election);
        assert.equal(allowed, true, "should be allowed");
        await allowance.deduct(accountOwner, {from: election});
        let votes = await allowance.allowance(accountOwner);
        assert.equal(votes, 9, "should have 9 votes");
    });

    it("should not allow invalid election to transact", async function () {
        let allowed = await allowance.electionIsAllowed(accountOwner, invalidElection);
        assert.equal(allowed, false, "should not be allowed");
        await assertThrowsAsync(async function(){
            await allowance.deduct(accountOwner, {from: election});
        }, Error, "should throw Error");
        let votes = await allowance.allowance(accountOwner);
        assert.equal(votes, 10, "should still have 10 votes");
    });

    it("should remove allowance", async function () {
        await allowance.addElection(election, {from: accountOwner});
        await allowance.removeElection(election, {from: accountOwner});
        let allowed = await allowance.electionIsAllowed(accountOwner, election);
        assert.equal(allowed, false, "should not be allowed");
    });

    it("should not let non-admin add votes", async function () {
        await assertThrowsAsync(async function(){
            await allowance.addVotes(accountOwner, 5, {from: notAdmin});
        }, Error, "should throw Error")
    });
});
