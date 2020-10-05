import $ from 'jquery';
import _ from 'lodash';
import handlers from './modules/handlers';
import msg from './modules/msg';

// here we use SHARED message handlers, so all the contexts support the same
// commands. but this is NOT typical messaging system usage, since you usually
// want each context to handle different commands. for this you don't need
// handlers factory as used below. simply create individual `handlers` object
// for each context and pass it to msg.init() call. in case you don't need the
// context to support any commands, but want the context to cooperate with the
// rest of the extension via messaging system (you want to know when new
// instance of given context is created / destroyed, or you want to be able to
// issue command requests from this context), you may simply omit the
// `handlers` parameter for good when invoking msg.init()

console.log('CONTENT SCRIPT WORKS!'); // eslint-disable-line no-console

msg.init('ct', handlers.create('ct'));

console.log('jQuery version:', $().jquery); // eslint-disable-line no-console

const middlePanel = $('#middle_panel');

const priceEl = $("[name='bargain_price']");

console.log(middlePanel, priceEl);

if (priceEl) {
    console.log("here");
    console.log(middlePanel, priceEl);
    $('<button id="calcButton" type="button">Calc</button>').insertAfter(priceEl);

    // priceEl.insertAfter('<button id="calcButton">Calc</button>');
    $('#calcButton').click(
        function() {
            priceEl.text = computePrice();
        window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
    })
}

function computePrice(){
    if(middlePanel.text().indexOf("buy") > 0){
        console.log("buy")
        const price = computeSell();
        console.log(price);

        priceEl.val(price);
    } else {
        console.log("sell")
        const price = computeBuy();
        priceEl.val(price);
    }
}

function getInfo() {
    const comments = middlePanel.find("form").getComments();
    console.log(comments);
    const keys = _.trim(comments[1].data).split(":");
    const values = _.trim(comments[2].data).replace("(", "").replace(")", "").split(":");
    const info = _.zipObject(keys, values);
    console.log(info);
    return info;
}

/* 	
public function getIdealPrice($goodID, $transactionType, $numGoods, $relations) : int {
		$relations = min(1000, $relations); // no effect for higher relations
		$good = $this->getGood($goodID);
		$base = $good['BasePrice'] * $numGoods;
		$maxSupply = $good['Max'];
		$supply = $this->getGoodAmount($goodID);
		$dist = $this->getGoodDistance($goodID);
	
		$distFactor = pow($dist, 1.3);
		if ($transactionType == 'Sell') {
			// Trader sells
			$supplyFactor = 1 + ($supply / $maxSupply);
			$relationsFactor = 1.2 + 1.8 * ($relations / 1000); // [0.75-3]
			$scale = 0.088;
		} elseif ($transactionType == 'Buy') {
			// Trader buys
			$supplyFactor = 2 - ($supply / $maxSupply);
			$relationsFactor = 3 - 2 * ($relations / 1000);
			$scale = 0.03;
		} else {
			throw new Exception('Unknown transaction type');
		}
		return IRound($base * $scale * $distFactor * $supplyFactor * $relationsFactor);
    }
    */

function computeBuy() {
    const info = getInfo()
    const distFactor = Math.pow(info["Good.Distance"], 1.3);
    const supplyFactor = 2 - (info["Port.Good.Amount"] / info["Port.Good.Max"])
    const relationsFactor = 3 - 2 * (info.Relations / 1000);
    const scale = 0.03;
    return Math.round(info["Good.BasePrice"] * info["Trade.Amount"] * scale * distFactor * supplyFactor * relationsFactor);
}

function computeSell() {
    const info = getInfo()
    const distFactor = Math.pow(info["Good.Distance"], 1.3);
    const supplyFactor = 1 + (info["Port.Good.Amount"] / info["Port.Good.Max"])
    const relationsFactor = 1.2 + 1.8 * (info.Relations / 1000);
    const scale = 0.088;
    return Math.round(info["Good.BasePrice"] * info["Trade.Amount"] * scale * distFactor * supplyFactor * relationsFactor);
}

$.fn.getComments = function () {
    return this.contents().filter(function () {
        return this.nodeType === 8
    })
}