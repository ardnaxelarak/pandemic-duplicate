var PACKAGE = 'pandemic-duplicate';
var BASE_URL = location.href;
if (BASE_URL.indexOf('#') != -1) {
	BASE_URL = BASE_URL.substring(0, BASE_URL.indexOf('#'));
}

var Roles = [
	'Dispatcher',
	'Operations Expert',
	'Scientist',
	'Medic',
	'Researcher'
	];
var Cities = [
	// Blue cities
	'Atlanta',
	'New York',
	'Chicago',
	'Toronto',
	'San Francisco',
	'Washington',
	'London',
	'Madrid',
	'Paris',
	'Essen',
	'Milan',
	'St. Petersburg',

	// Yellow cities
	'Los Angeles',
	'Mexico City',
	'Miami',
	'Bogota',
	'Lima',
	'Santiago',
	'Sao Paulo',
	'Buenos Aires',
	'Lagos',
	'Johannesburg',
	'Kinshasa',
	'Khartoum',

	//Black cities
	'Delhi',
	'Karachi',
	'Tehran',
	'Mumbai',
	'Riyadh',
	'Cairo',
	'Algiers',
	'Baghdad',
	'Chennai',
	'Moscow',
	'Istanbul',
	'Kalkuta',

	//Red cities
	'Hong Kong',
	'Bangkok',
	'Shanghai',
	'Beijing',
	'Seoul',
	'Tokyo',
	'Osaka',
	'Taipei',
	'Jakarta',
	'Ho Chi Minh City',
	'Manila',
	'Sydney'

	];
var Specials = [
	'Airlift',
	'Borrowed Time',
	'Commercial Travel Ban',
	'Forecast',
	'Government Grant',
	'Mobile Hospital',
	'New Assignment',
	'One Quiet Night',
	'Rapid Vaccine Deployment',
	'Re-examined Research',
	'Remote Treatment',
	'Resilient Population',
	'Special Orders',
	];
var G = null;

function shuffle_array(A)
{
	for (var i = 0; i < A.length; i++) {
		var j = i + Math.floor(Math.random() * (A.length-i));
		var tmp = A[i];
		A[i] = A[j];
		A[j] = tmp;
	}
}

function generate_decks()
{
	var S = [];
	for (var i = 0; i < Specials.length; i++) {
		S.push(Specials[i]);
	}
	shuffle_array(S);

	var A = [];
	for (var i = 0; i < Cities.length; i++) {
		A.push(Cities[i]);
	}
	for (var i = 0; i < S.length && i < G.rules.player_count*2; i++) {
		A.push(S[i]);
	}

	var R = [];
	for (var i = 0; i < Roles.length; i++) {
		R.push(Roles[i]);
	}
	shuffle_array(R);

	shuffle_array(A);
	var hand_size = G.rules.player_count <= 2 ? 4 :
		G.rules.player_count == 3 ? 3 : 2;

	G.initial_hands = {};
	G.roles = {};
	for (var i = 0; i < G.rules.player_count; i++) {
		var b = [];
		for (var j = 0; j < hand_size; j++) {
			var c = A.pop();
			b.push(c);
		}
		G.initial_hands[(1+i)] = b;
		G.roles[(1+i)] = R.pop();
	}

	var piles = [];
	for (var i = 0; i < G.rules.level; i++) {
		piles.push(['Epidemic']);
	}
	for (var i = 0; i < A.length; i++) {
		var j = Math.floor(Math.random()*piles.length);
		piles[j].push(A[i]);
	}
	G.player_deck = [];
	for (var i = 0; i < piles.length; i++) {
		shuffle_array(piles[i]);
		for (var j = 0; j < piles[i].length; j++) {
			G.player_deck.push(piles[i][j]);
		}
	}

	G.infection_deck = [];
	for (var i = 0; i < Cities.length; i++) {
		G.infection_deck.push(Cities[i]);
	}
	shuffle_array(G.infection_deck);

	var XX = JSON.stringify({
	'initial_hands': G.initial_hands,
	'roles': G.roles,
	'player_deck': G.player_deck,
	'infection_deck': G.infection_deck,
	'rules': G.rules
	});
	G.shuffle_name = CryptoJS.SHA1(XX);

	localStorage.setItem(PACKAGE + '.shuffle.' + G.shuffle_name, XX);
	stor_add_to_set(PACKAGE + '.deals_by_rules.' + stringify_rules(G.rules), G.shuffle_name);

	return G.shuffle_name;
}

function load_shuffle(shuffle_id)
{
	var s = localStorage.getItem(PACKAGE + '.shuffle.' + shuffle_id);
	if (!s) {
		console.log('Fatal: shuffle '+shuffle_id+' is not known');
		return;
	}

	G = JSON.parse(s);
	return G;
}

function stringify_rules(R)
{
	return R.expansion+'-'+R.player_count+'p-'+R.level+'x';
}

function parse_rules(s)
{
	var ss = s.split(/-/);
	return {
	'expansion': ss[0],
	'player_count': +ss[1].substring(0, ss[1].length-1),
	'level': +ss[2].substring(0, ss[2].length-1),
	};
}

function submit_create_game_form()
{
	var f = document.create_game_form;
	var rules = {
		'player_count': +f.player_count.value,
		'expansion': f.expansion.value,
		'level': +f.level.value
		};
	var rules_key = stringify_rules(rules);

	history.pushState(null, null, BASE_URL + '#pick_game/' + rules_key);
	on_state_init();
	return false;
}

function generate_new_game_clicked()
{
	G = {};
	G.rules = parse_rules(document.pick_game_form.rules.value);
	var shuffle_id = generate_decks();

	var u = BASE_URL + '#'+shuffle_id+'/names';
	history.pushState(null, null, u);
	on_state_init();
}

function init_player_names_page($pg, shuffle_id)
{
	load_shuffle(shuffle_id);

	if (G.rules.player_count <= 2) {
		$('.player3', $pg).hide();
		$('.player4', $pg).hide();
	}
	else if (G.rules.player_count == 3) {
		$('.player3', $pg).show();
		$('.player4', $pg).hide();
	}
	else {
		$('.player3', $pg).show();
		$('.player4', $pg).show();
	}
}

function submit_player_names_form()
{
	var f = document.player_names_form;
	G.player_names = {
		'1': f.player1.value,
		'2': f.player2.value,
		'3': f.player3.value,
		'4': f.player4.value
		};
	var randomize = f.randomize_order.checked;

	show_page('deck_setup_page');
	$('#player_cards_list').empty();
	for (var i = 0; i < G.player_deck.length; i++) {
		var c = G.player_deck[i];
		var $x = $('<li></li>');
		$x.text(c);
		$('#player_cards_list').append($x);
	}

	$('#infection_cards_list').empty();
	for (var i = 0; i < G.infection_deck.length; i++) {
		var c = G.infection_deck[i];
		var $x = $('<li></li>');
		$x.text(c);
		$('#infection_cards_list').append($x);
	}

	return false;
}

function continue_after_deck_setup()
{
	show_page('board_setup_page');

	$('.3cube_cities').empty();
	for (var i = 0; i < 3; i++) {
		var c = G.infection_deck[i];
		var $x = $('<li></li>');
		$x.text(c);
		$('.3cube_cities').append($x);
	}

	$('.2cube_cities').empty();
	for (var i = 3; i < 6; i++) {
		var c = G.infection_deck[i];
		var $x = $('<li></li>');
		$x.text(c);
		$('.2cube_cities').append($x);
	}

	$('.1cube_cities').empty();
	for (var i = 6; i < 9; i++) {
		var c = G.infection_deck[i];
		var $x = $('<li></li>');
		$x.text(c);
		$('.1cube_cities').append($x);
	}
}

function continue_after_board_setup()
{
	show_page('player_setup_page');

	var $pg = $('#player_setup_page');
	if (G.rules.player_count <= 2) {
		$('.player3', $pg).hide();
		$('.player4', $pg).hide();
	}
	else if (G.rules.player_count == 3) {
		$('.player3', $pg).show();
		$('.player4', $pg).hide();
	}
	else {
		$('.player3', $pg).show();
		$('.player4', $pg).show();
	}

	for (var i = 1; i <= G.rules.player_count; i++) {
		$('.player'+i+' .player_name', $pg).text(G.player_names[i]);
		$('.player'+i+' .role', $pg).text(G.roles[i]);
		$('.player'+i+' .card_list', $pg).empty();
		for (var j = 0; j < G.initial_hands[i].length; j++) {
			var c = G.initial_hands[i][j];
			var $c = make_player_card(c);
			$('.player'+i+' .card_list', $pg).append($c);
		}
	}
}

function make_player_card(c)
{
	var $x = $('<li></li>');
	$x.text(c);
	return $x;
}

function make_infection_card(c)
{
	var $x = $('<li></li>');
	$x.text(c);
	return $x;
}

function continue_after_player_setup()
{
	G.turn = 1;
	begin_turn();
}

function begin_turn()
{
	var $pg = show_page('player_turn_page');
	$('.page_header .player_name', $pg).text(
			G.player_names[G.turn]
			);
}

function continue_after_player_turn()
{
	var $pg = show_page('draw_cards_page');
	$('.player_name', $pg).text(
			G.player_names[G.turn]
			);

	$('.card_list', $pg).empty();
	var c1 = G.player_deck.pop();
	var c2 = G.player_deck.pop();
	$('.card_list', $pg).append(make_player_card(c1));
	$('.card_list', $pg).append(make_player_card(c2));
}

function continue_after_draw_phase()
{
	var $pg = show_page('infection_page');

	var cc = [];
	cc.push(G.infection_deck.pop());
	cc.push(G.infection_deck.pop());

	$('.card_list', $pg).empty();
	for (var i = 0; i < cc.length; i++) {
		$('.card_list', $pg).append(make_infection_card(cc[i]));
	}

	$('.player_name', $pg).text(
		G.player_names[
			1+(G.turn%G.rules.player_count)
			]);
}

function continue_after_infection()
{
	var t = +G.turn;
	G.turn = (t % G.rules.player_count) + 1;
	begin_turn();
}

function show_page(page_name)
{
	$(".page").hide();
	return $("#"+page_name).show();
}

function stor_add_to_set(key, value)
{
	var a = stor_get_list(key);
	var found = false;
	for (var i = 0; i < a.length; i++) {
		if (a[i] == value) {
			return false;
		}
	}
	a.push(value);
	localStorage.setItem(key, a.join(','));
	return true;
}

function stor_get_list(key)
{
	var s = localStorage.getItem(key);
	if (s) {
		return s.split(/,/);
	}
	else {
		return [];
	}
}

function shuffle_name(shuffle_id)
{
	var A = parseInt(shuffle_id.substring(0,6), 16);
	var i = Math.floor(A * WORDS.length / 0x1000000);

	var B = parseInt(shuffle_id.substring(6,12), 16);
	var j = Math.floor(B * WORDS.length / 0x1000000);

	var C = parseInt(shuffle_id.substring(12,18), 16);
	var k = Math.floor(C * WORDS.length / 0x1000000);

	return WORDS[i]+' '+WORDS[j]+' '+WORDS[k];
}

function init_pick_game_page($pg, rulestr)
{
	document.pick_game_form.rules.value = rulestr;

	var a = stor_get_list(PACKAGE + '.deals_by_rules.' + rulestr);
	for (var i = 0; i < a.length; i++) {

		var $tr = $('.preshuffle_row.template').clone();
		$tr.removeClass('template');
		$('button',$tr).text(shuffle_name(a[i]));
		$('.preshuffle_table', $pg).append($tr);
	}
}

function on_state_init()
{
	var path = location.hash;
	if (path && path.substring(0,1) == '#') {
		path = path.substring(1);
	}

	var m;
	if (!path) {
		return show_page('create_game_page');
	}
	else if (m = path.match(/^pick_game\/(.*)$/)) {
		var $pg = show_page('pick_game_page');
		return init_pick_game_page($pg, m[1]);
	}
	else if (m = path.match(/^([0-9a-f]+)\/names$/)) {
		var $pg = show_page('player_names_page');
		return init_player_names_page($pg, m[1]);
	}
}

$(function() {
	window.addEventListener('popstate', on_state_init);
	on_state_init();
});
