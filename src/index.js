import './style.scss';
import * as d3 from "d3";
import serverData from './movies.json';
import appTemplate from './template.html';

(() => {
	const holder = d3.select('#wrapper').html(appTemplate);
	const bar = holder.select('.top-list');
	const popup = holder.select('.popup-holder');
	const popupInfo = popup.select('.info');
	const classes = {
		active: 'active',
		favorite: 'favorite'
	};
	const data = {
		popupData: null,
		movies: serverData.data.movies,
		favorites: localStorage.favorites ? localStorage.favorites.split(',') : []
	};

	// toggle favorite movie
	const toggleFavorite = (d) => {
		let index = data.favorites.indexOf(d.idIMDB);
			if (index > -1) {
				data.favorites.splice(index, 1);
			} else {
				data.favorites.push(d.idIMDB);
			}
		localStorage.setItem('favorites', data.favorites.join(','));
		refreshItem();
	};
	// refresh item classes
	const refreshItem = () => {
		item.attr('class', (d) => {
			let itemClass = '';
			if (data.popupData !== null && data.popupData.idIMDB === d.idIMDB) {
				itemClass += classes.active;
			}
			if (data.favorites.indexOf(d.idIMDB) > -1) {
				itemClass += (itemClass.length ? ' ' : '') + classes.favorite;
			}
			return itemClass;
		});
	};
	// hide popup
	const closePopup = () => {
		data.popupData = null;
		popup.classed(classes.active, false);
		refreshItem();
	};
	// show popup
	const showPopup = () => {
		popup.classed(classes.active, true)
			.select('.poster')
			.attr('src', data.popupData.urlPoster);
		popup.select('.title')
			.text(data.popupData.title);
		popup.select('.plot')
			.text(data.popupData.plot);
		popup.select('.year')
			.text(data.popupData.year);
		popup.select('.rating')
			.text(data.popupData.rating);
		popup.select('.genres')
			.html(() => {
				return data.popupData.genres.reduce((prev, next) => {
					return prev + (prev.length ? ', ' : '') + next;
				}, '');
			});
		popup.select('.countries')
			.html(() => {
				return data.popupData.countries.reduce((prev, next) => {
					return prev + (prev.length ? ', ' : '') + next;
				}, '');
			});
		popup.select('.directors')
			.html(() => {
				return data.popupData.directors.reduce((prev, next) => {
					return prev + (prev.length ? ', ' : '') + `
						<a target="_blank" href="http://www.imdb.com/name/${ next.id }/">${next.name}</a>
					`;
				}, '');
			});
		let btn = popup.select('.btn-favorite')
			.on('click',() => {
				toggleFavorite(data.popupData);
				btn.classed(classes.active, data.favorites.indexOf(data.popupData.idIMDB) > -1);
			})
			.classed(classes.active, data.favorites.indexOf(data.popupData.idIMDB) > -1);
	};

	// add items
	const item = bar.select('.list')
		.selectAll('li')
		.data(data.movies)
		.enter()
		.append('li');

	// add popup opener
	item.append('button')
		.on('click',(d) => {
			data.popupData = d;
			refreshItem();
			showPopup();
		})
		.attr('class', 'btn-opener')
		.text((d) => d.title);

	// add favorite toggler
	item.append('button')
		.attr('class', 'btn-favorite')
		.on('click', toggleFavorite)
		.append('i')
		.attr('class', 'icon-star');

	// popup closers
	popup.selectAll('.closer, .overlay')
		.on('click', closePopup);

	// bar toggler 
	bar.append('button')
		.on('click',() => {
			bar.classed(classes.active, bar.classed(classes.active) ? false : true);
		})
		.attr('class', 'opener');

	refreshItem();
})();