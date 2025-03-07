import type { IconifyIcon, IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon';
import { IconSet } from '../../lib/icon-set';
import type { ResolvedIconifyIcon } from '../../lib/icon-set/types';

describe('Working with aliases', () => {
	test('Resolving aliases', () => {
		const iconSetData: IconifyJSON = {
			prefix: 'foo',
			icons: {
				bar: {
					body: '<g id="bar" />',
					// Default values
					width: 16,
					height: 16,
				},
				TestIcon: {
					body: '<g id="TestIcon" />',
					width: 24,
					height: 24,
				},
			},
			aliases: {
				// Alias: no modifications
				alias1: {
					parent: 'bar',
				},
				// Variation: has transformation
				variation_1: {
					parent: 'TestIcon',
					hFlip: true,
				},
				// No parent icon
				invalid: {
					parent: 'missing',
				},
				// Nested aliases
				alias2: {
					parent: 'alias1',
				},
				alias3: {
					parent: 'alias2',
				},
				alias4: {
					parent: 'alias3',
				},
				alias5: {
					parent: 'alias4',
				},
				alias6: {
					parent: 'alias5',
				},
				alias7: {
					parent: 'alias6',
				},
			},
		};
		const iconSet = new IconSet(iconSetData);

		// List all icons
		expect(iconSet.list()).toEqual(['bar', 'TestIcon', 'variation_1']);
		expect(iconSet.count()).toBe(3);

		// Resolve aliases
		const expectedBar: ResolvedIconifyIcon = {
			body: '<g id="bar" />',
		};
		expect(iconSet.resolve('bar')).toEqual(expectedBar);
		expect(iconSet.resolve('alias1')).toEqual(expectedBar);
		expect(iconSet.resolve('alias2')).toEqual(expectedBar);
		expect(iconSet.resolve('alias3')).toEqual(expectedBar);
		expect(iconSet.resolve('alias4')).toEqual(expectedBar);
		expect(iconSet.resolve('alias5')).toEqual(expectedBar);
		expect(iconSet.resolve('alias6')).toEqual(expectedBar);
		expect(iconSet.resolve('alias7')).toEqual(expectedBar);

		const expectedTestIcon: ResolvedIconifyIcon = {
			body: '<g id="TestIcon" />',
			width: 24,
			height: 24,
		};
		expect(iconSet.resolve('TestIcon')).toEqual(expectedTestIcon);
		expect(iconSet.resolve('variation_1')).toEqual({
			...expectedTestIcon,
			hFlip: true,
		});

		// Test removing alias and aliases that use that alias
		// Remove 'alias3' + 'alias4' ... 'alias7'
		expect(iconSet.remove('alias3')).toBe(5);
		expect(iconSet.resolve('alias2')).toEqual(expectedBar);
		expect(iconSet.resolve('alias3')).toBeNull();
		expect(iconSet.resolve('alias4')).toBeNull();
		expect(iconSet.resolve('alias5')).toBeNull();
	});

	test('Checking alias depth', () => {
		const iconSetData: IconifyJSON = {
			prefix: 'foo',
			icons: {
				test: {
					body: '<g />',
				},
			},
			aliases: {
				alias1: {
					parent: 'test',
				},
				alias2: {
					parent: 'alias1',
				},
				alias3: {
					parent: 'alias2',
				},
				alias4: {
					parent: 'alias3',
				},
				alias5: {
					parent: 'alias4',
				},
				alias6: {
					parent: 'alias5',
				},
				alias7: {
					parent: 'alias6',
				},
				alias8: {
					parent: 'alias7',
				},
			},
		};
		const iconSet = new IconSet(iconSetData);

		// List all icons
		expect(iconSet.list()).toEqual(['test']);

		// Resolve aliases
		const expectedIcon: IconifyIcon = {
			body: '<g />',
		};

		// Test both resolve() from IconSet and getIconData() from Utils to make sure both generate identical results
		expect(iconSet.resolve('test')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'test')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias1')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias1')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias2')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias2')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias3')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias3')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias4')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias4')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias5')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias5')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias6')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias6')).toEqual(expectedIcon);

		// Should no longer fail: recursion can be unlimited because of new tree handling algorythm
		expect(iconSet.resolve('alias7')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias7')).toEqual(expectedIcon);

		expect(iconSet.resolve('alias8')).toEqual(expectedIcon);
		expect(getIconData(iconSetData, 'alias8')).toEqual(expectedIcon);
	});

	test('Hidden icons', () => {
		const iconSetData: IconifyJSON = {
			prefix: 'foo',
			icons: {
				bar: {
					body: '<g id="bar" />',
					// Default values
					width: 16,
					height: 16,
				},
				TestIcon: {
					body: '<g id="TestIcon" />',
					width: 24,
					height: 24,
					hidden: true,
				},
			},
			aliases: {
				// Alias: no modifications
				alias1: {
					parent: 'bar',
				},
				// Variation: has transformation
				variation_1: {
					parent: 'TestIcon',
					hFlip: true,
				},
				// No parent icon
				invalid: {
					parent: 'missing',
				},
			},
		};
		const iconSet = new IconSet(iconSetData);

		// List all icons
		expect(iconSet.list()).toEqual(['bar', 'TestIcon', 'variation_1']);
		expect(iconSet.count()).toBe(1);

		expect(iconSet.exists('alias1')).toBe(true);
		expect(iconSet.exists('TestIcon')).toBe(true);
		expect(iconSet.exists('variation_1')).toBe(true);

		// Test removing icon and its variation
		// Remove 'TestIcon' + 'variation_1'
		expect(iconSet.remove('TestIcon')).toBe(2);

		expect(iconSet.exists('alias1')).toBe(true);
		expect(iconSet.exists('TestIcon')).toBe(false);
		expect(iconSet.exists('variation_1')).toBe(false);
	});

	test('Rename icon, test characters and categories', () => {
		const lastModified = 12345;
		const iconSetData: IconifyJSON = {
			prefix: 'foo',
			lastModified,
			icons: {
				bar: {
					body: '<g id="bar" />',
					// Default values
					width: 16,
					height: 16,
				},
				TestIcon: {
					body: '<g id="TestIcon" />',
					width: 24,
					height: 24,
					hidden: true,
				},
			},
			aliases: {
				// Alias: no modifications
				alias1: {
					parent: 'bar',
				},
				// Variation: has transformation
				variation_1: {
					parent: 'TestIcon',
					hFlip: true,
				},
				// No parent icon
				invalid: {
					parent: 'missing',
				},
			},
			chars: {
				f00: 'bar',
				f01: 'TestIcon',
				f02: 'alias1',
				f03: 'variation_1',
			},
			categories: {
				'To Rename': ['TestIcon'],
				'Other': ['bar', 'variation_1', 'no-such-icon'],
				'Empty': ['no-such-icon'],
			},
		};
		const iconSet = new IconSet(iconSetData);

		// List all icons
		expect(iconSet.list()).toEqual(['bar', 'TestIcon', 'variation_1']);
		expect(iconSet.count()).toBe(1);

		expect(iconSet.exists('alias1')).toBe(true);
		expect(iconSet.exists('TestIcon')).toBe(true);
		expect(iconSet.exists('variation_1')).toBe(true);
		expect(iconSet.exists('foo')).toBe(false);
		expect(iconSet.lastModified).toBe(lastModified);

		// Rename 'TestIcon' to 'foo'
		expect(iconSet.rename('TestIcon', 'foo')).toBe(true);

		// Make sure it was renamed and other icons were not affected
		expect(iconSet.exists('alias1')).toBe(true);
		expect(iconSet.exists('TestIcon')).toBe(false);
		expect(iconSet.exists('variation_1')).toBe(true);
		expect(iconSet.exists('foo')).toBe(true);
		expect(iconSet.lastModified).not.toBe(lastModified);

		const expectedTestIcon: ResolvedIconifyIcon = {
			body: '<g id="TestIcon" />',
			width: 24,
			height: 24,
			hidden: true,
		};
		expect(iconSet.resolve('foo')).toEqual(expectedTestIcon);
		expect(iconSet.resolve('variation_1')).toEqual({
			...expectedTestIcon,
			hFlip: true,
		});

		// Export
		const iconSetExportedData: IconifyJSON = {
			prefix: 'foo',
			lastModified: iconSet.lastModified,
			icons: {
				bar: {
					body: '<g id="bar" />',
				},
				foo: {
					body: '<g id="TestIcon" />',
					width: 24,
					height: 24,
					hidden: true,
				},
			},
			aliases: {
				alias1: {
					parent: 'bar',
				},
				variation_1: {
					parent: 'foo',
					hFlip: true,
				},
				// Invalid alias should be exported because validation is not done on import
				invalid: {
					parent: 'missing',
				},
			},
			chars: {
				f00: 'bar',
				f01: 'foo',
				f02: 'alias1',
				f03: 'variation_1',
			},
			categories: {
				// 'foo' and 'variation_1' are hidden, 'no-such-icon' does not exist
				Other: ['bar'],
			},
		};
		expect(iconSet.export(false)).toEqual(iconSetExportedData);

		// Export with validation: 'invalid' alias should not be there
		delete iconSetExportedData.aliases?.['invalid'];
		expect(iconSet.export()).toEqual(iconSetExportedData);
	});

	test('Aliases with categories', () => {
		const lastModified = 12345;
		const iconSetData: IconifyJSON = {
			prefix: 'foo',
			lastModified,
			icons: {
				bar: {
					body: '<g id="bar" />',
				},
				TestIcon: {
					body: '<g id="TestIcon" />',
				},
			},
			aliases: {
				// Alias: no modifications
				alias1: {
					parent: 'bar',
				},
				// Variation: has transformation
				variation_1: {
					parent: 'TestIcon',
					hFlip: true,
				},
			},
			categories: {
				Bar: ['bar'],
				TestIcon: ['TestIcon'],
				// Ignored: aliases cannot have categories
				Other: ['alias1', 'variation_1'],
			},
		};
		const iconSet = new IconSet(iconSetData);

		// Export
		const iconSetExportedData: IconifyJSON = {
			prefix: 'foo',
			lastModified,
			icons: {
				bar: {
					body: '<g id="bar" />',
				},
				TestIcon: {
					body: '<g id="TestIcon" />',
				},
			},
			aliases: {
				// Alias: no modifications
				alias1: {
					parent: 'bar',
				},
				// Variation: has transformation
				variation_1: {
					parent: 'TestIcon',
					hFlip: true,
				},
			},
			categories: {
				Bar: ['bar'],
				TestIcon: ['TestIcon'],
			},
		};
		expect(iconSet.export(false)).toEqual(iconSetExportedData);
	});
});
