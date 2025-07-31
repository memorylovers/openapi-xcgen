///
/// Generated file. Do not edit.
///
// coverage:ignore-file
// ignore_for_file: type=lint, unused_import

part of 'strings.g.dart';

// Path: <root>
typedef TranslationsEn = Translations; // ignore: unused_element
class Translations implements BaseTranslations<AppLocale, Translations> {
	/// Returns the current translations of the given [context].
	///
	/// Usage:
	/// final i18n = Translations.of(context);
	static Translations of(BuildContext context) => InheritedLocaleData.of<AppLocale, Translations>(context).translations;

	/// You can call this constructor and build your own translation instance of this locale.
	/// Constructing via the enum [AppLocale.build] is preferred.
	Translations({Map<String, Node>? overrides, PluralResolver? cardinalResolver, PluralResolver? ordinalResolver, TranslationMetadata<AppLocale, Translations>? meta})
		: assert(overrides == null, 'Set "translation_overrides: true" in order to enable this feature.'),
		  $meta = meta ?? TranslationMetadata(
		    locale: AppLocale.en,
		    overrides: overrides ?? {},
		    cardinalResolver: cardinalResolver,
		    ordinalResolver: ordinalResolver,
		  ) {
		$meta.setFlatMapFunction(_flatMapFunction);
	}

	/// Metadata for the translations of <en>.
	@override final TranslationMetadata<AppLocale, Translations> $meta;

	/// Access flat map
	dynamic operator[](String key) => $meta.getTranslation(key);

	late final Translations _root = this; // ignore: unused_field

	Translations $copyWith({TranslationMetadata<AppLocale, Translations>? meta}) => Translations(meta: meta ?? this.$meta);

	// Translations
	late final TranslationsAppEn app = TranslationsAppEn.internal(_root);
	late final TranslationsCommonEn common = TranslationsCommonEn.internal(_root);
	late final TranslationsErrorEn error = TranslationsErrorEn.internal(_root);
	late final TranslationsLoginEn login = TranslationsLoginEn.internal(_root);
	late final TranslationsSettingsEn settings = TranslationsSettingsEn.internal(_root);
	late final TranslationsPaymentEn payment = TranslationsPaymentEn.internal(_root);
	late final TranslationsForceUpdateEn forceUpdate = TranslationsForceUpdateEn.internal(_root);
}

// Path: app
class TranslationsAppEn {
	TranslationsAppEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get name => 'MyApp';
}

// Path: common
class TranslationsCommonEn {
	TranslationsCommonEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get retry => 'Retry';
	String get ok => 'OK';
	String get cancel => 'Cancel';
	String get save => 'Save';
	String get edit => 'Edit';
	String get delete => 'Delete';
	String get add => 'Add';
	String get create => 'Create';
}

// Path: error
class TranslationsErrorEn {
	TranslationsErrorEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get unexpected => 'An Unexpected Error has occurred';
}

// Path: login
class TranslationsLoginEn {
	TranslationsLoginEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get title => 'Login';
	String get googleSignIn => 'Sign in with Google';
	String get appleSignIn => 'Sign in with Apple';
	String get anonymousSignIn => 'Continue as Guest';
}

// Path: settings
class TranslationsSettingsEn {
	TranslationsSettingsEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get title => 'Settings';
	String get account => 'Account';
	String get payment => 'Subscription';
	String get contact => 'Contact Us';
}

// Path: payment
class TranslationsPaymentEn {
	TranslationsPaymentEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get title => 'Subscription';
	String get description => 'Upgrade to premium for more features';
}

// Path: forceUpdate
class TranslationsForceUpdateEn {
	TranslationsForceUpdateEn.internal(this._root);

	final Translations _root; // ignore: unused_field

	// Translations
	String get title => 'Please Update';
	String get desc => 'A new version of the app is available. Please update from the store.';
	String get label => 'Update Now';
}

/// Flat map(s) containing all translations.
/// Only for edge cases! For simple maps, use the map function of this library.
extension on Translations {
	dynamic _flatMapFunction(String path) {
		switch (path) {
			case 'app.name': return 'MyApp';
			case 'common.retry': return 'Retry';
			case 'common.ok': return 'OK';
			case 'common.cancel': return 'Cancel';
			case 'common.save': return 'Save';
			case 'common.edit': return 'Edit';
			case 'common.delete': return 'Delete';
			case 'common.add': return 'Add';
			case 'common.create': return 'Create';
			case 'error.unexpected': return 'An Unexpected Error has occurred';
			case 'login.title': return 'Login';
			case 'login.googleSignIn': return 'Sign in with Google';
			case 'login.appleSignIn': return 'Sign in with Apple';
			case 'login.anonymousSignIn': return 'Continue as Guest';
			case 'settings.title': return 'Settings';
			case 'settings.account': return 'Account';
			case 'settings.payment': return 'Subscription';
			case 'settings.contact': return 'Contact Us';
			case 'payment.title': return 'Subscription';
			case 'payment.description': return 'Upgrade to premium for more features';
			case 'forceUpdate.title': return 'Please Update';
			case 'forceUpdate.desc': return 'A new version of the app is available. Please update from the store.';
			case 'forceUpdate.label': return 'Update Now';
			default: return null;
		}
	}
}

