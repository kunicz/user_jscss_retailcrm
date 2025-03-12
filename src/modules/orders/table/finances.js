import { user } from '@src';

export default () => {
	admin();
	manager();
}

async function admin() {
	if (!user?.isAdmin) return;

	const filtersFromUrl = getFiltersFromUrl();
	const filtersForApi = transformFiltersForApi(filtersFromUrl);
	//console.log(filtersFromUrl, filtersForApi);

	/**
	 * Парсит URL-параметры и преобразует их в структурированный объект фильтров
	 * @returns {Object} Объект с фильтрами
	 */
	function getFiltersFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		const filters = {};

		urlParams.forEach((value, key) => {
			if (!isFilterParam(key)) return;

			const filterPath = extractFilterPath(key);
			const filterKeys = parseFilterPath(filterPath);

			setFilterValue(filters, filterKeys, value);
		});

		return filters;

		/**
		 * Проверяет, является ли параметр фильтром
		 * @param {string} key - Ключ параметра
		 * @returns {boolean} true если это параметр фильтра
		 */
		function isFilterParam(key) {
			return key.startsWith('filter[');
		}

		/**
		 * Извлекает путь фильтра из ключа параметра
		 * @param {string} key - Ключ параметра
		 * @returns {string} Путь фильтра
		 */
		function extractFilterPath(key) {
			return key.match(/^filter\[(.*?)\]$/)[1];
		}

		/**
		 * Разбирает путь фильтра на массив ключей
		 * @param {string} path - Путь фильтра
		 * @returns {Array} Массив ключей
		 */
		function parseFilterPath(path) {
			return path.split(/\]\[|\[|\]/).filter(Boolean);
		}

		/**
		 * Устанавливает значение фильтра в структуру
		 * @param {Object} filters - Объект фильтров
		 * @param {Array} keys - Массив ключей
		 * @param {string} value - Значение фильтра
		 */
		function setFilterValue(filters, keys, value) {
			let current = filters;

			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const isLastKey = i === keys.length - 1;
				const isArrayValue = shouldBeArray(keys, i);

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

		/**
		 * Определяет, должно ли значение быть массивом
		 * @param {Array} keys - Массив ключей
		 * @param {number} index - Текущий индекс
		 * @returns {boolean} true если значение должно быть массивом
		 */
		function shouldBeArray(keys, index) {
			return keys[index + 1] === "" || keys[index] === "in";
		}
	}

	/**
	 * Преобразует фильтры из URL в формат для API
	 * @param {Object} filters - Фильтры из URL
	 * @returns {Object} Фильтры в формате API
	 */
	function transformFiltersForApi(filters = {}) {
		const apiFilters = {};

		transformNumberToIds(filters, apiFilters);
		transformDateFields(filters, apiFilters);
		transformTotalSumm(filters, apiFilters);
		transformFlorists(filters, apiFilters);
		transformCouriers(filters, apiFilters);
		transformRemainingFields(filters, apiFilters);

		return apiFilters;

		/**
		 * Преобразует поле number в ids
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformNumberToIds(source, target) {
			if (source.number) {
				target.ids = Array.isArray(source.number) ? source.number : [source.number];
				delete source.number;
			}
		}

		/**
		 * Преобразует поля с датами
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformDateFields(source, target) {
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

		/**
		 * Преобразует поле totalSumm в minPrice/maxPrice
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformTotalSumm(source, target) {
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

		/**
		 * Преобразует поле florist из customFields
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformFlorists(source, target) {
			if (source.customFields?.florist?.in) {
				target.customFields = {
					florists: source.customFields.florist.in.map(Number)
				};
				delete source.customFields;
			}
		}

		/**
		 * Преобразует поле couriers
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformCouriers(source, target) {
			if (source.couriers?.in) {
				target.couriers = source.couriers.in.map(Number);
				delete source.couriers;
			}
		}

		/**
		 * Преобразует оставшиеся поля
		 * @param {Object} source - Исходные фильтры
		 * @param {Object} target - Целевые фильтры
		 */
		function transformRemainingFields(source, target) {
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
}

function manager() {
	if (user?.isAdmin) return;
	$('#list-total-margin,#list-total-summ').hide();
}