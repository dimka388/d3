import './style.scss';
import * as d3 from "d3";
import { forceAttract } from 'd3-force-attract';
import serverData from './movies.json';
import appTemplate from './template.html';

(() => {
	const holder = d3.select('#wrapper').html(appTemplate);
	const svgHolder = holder.select('.svg-holder');
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

	const drawSvg = () => {
		const colors = d3.schemeCategory20;
		let width = svgHolder.node().offsetWidth,
			height = svgHolder.node().offsetHeight,
			radius = 70;
		const svg = svgHolder.append('svg')
			.attr('width', '100%')
			.attr('height', '100%');

		const nodes = data.movies.map((item) => {
			return {
				item: item,
				x: width * Math.random(),
				y: height * Math.random(),
				r: radius,
				inertia: 0.05 + 0.15 * Math.random()
			};
		});

		const dragstarted = (d) => {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		const dragged = (d) => {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		const dragended = (d) => {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		const layoutTick = (e) => {
			node.attr("transform", (d) => {
				return "translate("+d.x+","+d.y+")";
			})
		}

		let simulation = d3.forceSimulation()
			.force('attract', forceAttract()
			.target([width / 2, height / 2])
			.strength((d) => d.inertia))
			.force('collide', d3.forceCollide((d) => d.r))
			.on('tick', layoutTick)
			.nodes(nodes);

		const node = svg.selectAll('circle')
			.data(nodes)
			.enter()
			.append('g')
			.style('cursor','pointer')
			.on('click', (d) => {
				data.popupData = d.item;
				refreshItem();
				showPopup();
			})
			.call(d3.drag()
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended)
			);

		node.append('circle')
			.style('fill', (d, i) => colors[i])
			.attr('cx', (d) => -d.r)
			.attr('cy', (d) => -d.r)
			.attr('r', (d) => d.r);


		node.append("text")
			.text((d) => d.item.title)
			.attr("class", "text")
			.style("text-anchor", "middle")
			.style("font-size", function(d) {
				return Math.min(2 * d.r, (2 * d.r) / this.getComputedTextLength() * 15) + "px";
			})
			.attr("dx", (d) => -d.r)
			.attr("dy", (d) => -d.r*0.9);
		
		window.addEventListener('resize', () => {
			width = svgHolder.node().offsetWidth;
			height = svgHolder.node().offsetHeight;
			simulation = d3.forceSimulation()
				.force('attract', forceAttract()
				.target([width / 2, height / 2])
				.strength((d) => d.inertia))
				.force('collide', d3.forceCollide((d) => d.r))
				.on('tick', layoutTick)
				.nodes(nodes);
		}, true);

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
	drawSvg();

})();