export default () => new AdminFinances().init();

class AdminFinances {
	init() {
		const filtersFromUrl = this.getFiltersFromUrl();
		const filtersForApi = this.transformFiltersForApi(filtersFromUrl);
		//console.log(filtersFromUrl, filtersForApi);
	}

	// Парсит URL-параметры и преобразует их в структурированный объект фильтров
	getFiltersFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		const filters = {};

		urlParams.forEach((value, key) => {
			if (!this.isFilterParam(key)) return;

			const filterPath = this.extractFilterPath(key);
			const filterKeys = this.parseFilterPath(filterPath);

			this.setFilterValue(filters, filterKeys, value);
		});

		return filters;
	}

	// Проверяет, является ли параметр фильтром
	isFilterParam(key) {
		return key.startsWith('filter[');
	}

	// Извлекает путь фильтра из ключа параметра
	extractFilterPath(key) {
		return key.match(/^filter\[(.*?)\]$/)[1];
	}

	// Разбирает путь фильтра на массив ключей
	parseFilterPath(path) {
		return path.split(/\]\[|\[|\]/).filter(Boolean);
	}

	// Устанавливает значение фильтра в структуру
	setFilterValue(filters, keys, value) {
		let current = filters;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLastKey = i === keys.length - 1;
			const isArrayValue = this.shouldBeArray(keys, i);

			if (isLastKey) {
				if (isArrayValue) {
					current[key] = current[key] || [];
					current[key].push(value);
				} else {
					current[key] = value;
				}
			} else {
				current[key] = current[key] || {};
				current = current[key];
			}
		}
	}

	// Определяет, должно ли значение быть массивом
	shouldBeArray(keys, index) {
		return keys[index + 1] === "" || keys[index] === "in";
	}

	// Преобразует фильтры из URL в формат для API
	transformFiltersForApi(filters = {}) {
		const apiFilters = {};

		this.transformNumberToIds(filters, apiFilters);
		this.transformDateFields(filters, apiFilters);
		this.transformTotalSumm(filters, apiFilters);
		this.transformFlorists(filters, apiFilters);
		this.transformCouriers(filters, apiFilters);
		this.transformRemainingFields(filters, apiFilters);

		return apiFilters;
	}

	// Преобразует поле number в ids
	transformNumberToIds(source, target) {
		if (source.number) {
			target.ids = Array.isArray(source.number) ? source.number : [source.number];
			delete source.number;
		}
	}

	// Преобразует поля с датами
	transformDateFields(source, target) {
		const dateFields = {
			createdAt: { from: 'createdAtFrom', to: 'createdAtTo' },
			deliveryDate: { from: 'deliveryDateFrom', to: 'deliveryDateTo' },
			deliveryTime: { from: 'deliveryTimeFrom', to: 'deliveryTimeTo' }
		};

		for (const [field, mapping] of Object.entries(dateFields)) {
			if (!source[field]) continue;

			if (source[field].gte?.abs) {
				target[mapping.from] = source[field].gte.abs;
			}
			if (source[field].lte?.abs) {
				target[mapping.to] = source[field].lte.abs;
			}
			if (source[field].gte && !source[field].gte.abs) {
				target[mapping.from] = source[field].gte;
			}
			if (source[field].lte && !source[field].lte.abs) {
				target[mapping.to] = source[field].lte;
			}

			delete source[field];
		}
	}

	// Преобразует поле totalSumm в minPrice/maxPrice
	transformTotalSumm(source, target) {
		if (source.totalSumm) {
			if (source.totalSumm.gte) {
				target.minPrice = source.totalSumm.gte;
			}
			if (source.totalSumm.lte) {
				target.maxPrice = source.totalSumm.lte;
			}
			delete source.totalSumm;
		}
	}

	// Преобразует поле florist из customFields
	transformFlorists(source, target) {
		if (source.customFields?.florist?.in) {
			target.customFields = {
				florists: source.customFields.florist.in.map(Number)
			};
			delete source.customFields;
		}
	}

	// Преобразует поле couriers
	transformCouriers(source, target) {
		if (source.couriers?.in) {
			target.couriers = source.couriers.in.map(Number);
			delete source.couriers;
		}
	}

	// Преобразует оставшиеся поля
	transformRemainingFields(source, target) {
		for (const key in source) {
			if (key === "sort" || key === "direction") continue;

			if (typeof source[key] === "object" && "in" in source[key]) {
				target[key] = source[key].in;
			} else {
				target[key] = source[key];
			}
		}
	}
}

