///
/// Generated file. Do not edit.
///
// coverage:ignore-file
// ignore_for_file: type=lint, unused_import

import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';
import 'package:slang/generated.dart';
import 'strings.g.dart';

// Path: <root>
class TranslationsJa extends Translations {
	/// You can call this constructor and build your own translation instance of this locale.
	/// Constructing via the enum [AppLocale.build] is preferred.
	TranslationsJa({Map<String, Node>? overrides, PluralResolver? cardinalResolver, PluralResolver? ordinalResolver, TranslationMetadata<AppLocale, Translations>? meta})
		: assert(overrides == null, 'Set "translation_overrides: true" in order to enable this feature.'),
		  $meta = meta ?? TranslationMetadata(
		    locale: AppLocale.ja,
		    overrides: overrides ?? {},
		    cardinalResolver: cardinalResolver,
		    ordinalResolver: ordinalResolver,
		  ),
		  super(cardinalResolver: cardinalResolver, ordinalResolver: ordinalResolver) {
		super.$meta.setFlatMapFunction($meta.getTranslation); // copy base translations to super.$meta
		$meta.setFlatMapFunction(_flatMapFunction);
	}

	/// Metadata for the translations of <ja>.
	@override final TranslationMetadata<AppLocale, Translations> $meta;

	/// Access flat map
	@override dynamic operator[](String key) => $meta.getTranslation(key) ?? super.$meta.getTranslation(key);

	late final TranslationsJa _root = this; // ignore: unused_field

	@override 
	TranslationsJa $copyWith({TranslationMetadata<AppLocale, Translations>? meta}) => TranslationsJa(meta: meta ?? this.$meta);

	// Translations
	@override late final _TranslationsAppJa app = _TranslationsAppJa._(_root);
	@override late final _TranslationsCommonJa common = _TranslationsCommonJa._(_root);
	@override late final _TranslationsErrorJa error = _TranslationsErrorJa._(_root);
	@override late final _TranslationsLoginJa login = _TranslationsLoginJa._(_root);
	@override late final _TranslationsSettingsJa settings = _TranslationsSettingsJa._(_root);
	@override late final _TranslationsPaymentJa payment = _TranslationsPaymentJa._(_root);
	@override late final _TranslationsForceUpdateJa forceUpdate = _TranslationsForceUpdateJa._(_root);
}

// Path: app
class _TranslationsAppJa extends TranslationsAppEn {
	_TranslationsAppJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get name => 'マイアプリ';
}

// Path: common
class _TranslationsCommonJa extends TranslationsCommonEn {
	_TranslationsCommonJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get retry => 'Retry';
	@override String get ok => 'OK';
	@override String get cancel => 'Cancel';
	@override String get save => 'Save';
	@override String get edit => 'Edit';
	@override String get delete => 'Delete';
	@override String get add => 'Add';
	@override String get create => 'Create';
}

// Path: error
class _TranslationsErrorJa extends TranslationsErrorEn {
	_TranslationsErrorJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get unexpected => 'エラーが発生しました';
}

// Path: login
class _TranslationsLoginJa extends TranslationsLoginEn {
	_TranslationsLoginJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get title => 'ログイン';
	@override String get googleSignIn => 'Googleでログイン';
	@override String get appleSignIn => 'Appleでログイン';
	@override String get anonymousSignIn => 'ログインなしではじめる';
}

// Path: settings
class _TranslationsSettingsJa extends TranslationsSettingsEn {
	_TranslationsSettingsJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get title => 'Settings';
	@override String get account => 'Account';
	@override String get payment => 'Subscription';
	@override String get contact => 'Contact Us';
}

// Path: payment
class _TranslationsPaymentJa extends TranslationsPaymentEn {
	_TranslationsPaymentJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get title => 'プレミアムプラン';
	@override String get description => 'プレミアムでより多くの機能を開放しよう';
}

// Path: forceUpdate
class _TranslationsForceUpdateJa extends TranslationsForceUpdateEn {
	_TranslationsForceUpdateJa._(TranslationsJa root) : this._root = root, super.internal(root);

	final TranslationsJa _root; // ignore: unused_field

	// Translations
	@override String get title => '更新のお知らせ';
	@override String get desc => '新しいバージョンのアプリが利用可能です。ストアより更新ください';
	@override String get label => '今すぐ更新';
}

/// Flat map(s) containing all translations.
/// Only for edge cases! For simple maps, use the map function of this library.
extension on TranslationsJa {
	dynamic _flatMapFunction(String path) {
		switch (path) {
			case 'app.name': return 'マイアプリ';
			case 'common.retry': return 'Retry';
			case 'common.ok': return 'OK';
			case 'common.cancel': return 'Cancel';
			case 'common.save': return 'Save';
			case 'common.edit': return 'Edit';
			case 'common.delete': return 'Delete';
			case 'common.add': return 'Add';
			case 'common.create': return 'Create';
			case 'error.unexpected': return 'エラーが発生しました';
			case 'login.title': return 'ログイン';
			case 'login.googleSignIn': return 'Googleでログイン';
			case 'login.appleSignIn': return 'Appleでログイン';
			case 'login.anonymousSignIn': return 'ログインなしではじめる';
			case 'settings.title': return 'Settings';
			case 'settings.account': return 'Account';
			case 'settings.payment': return 'Subscription';
			case 'settings.contact': return 'Contact Us';
			case 'payment.title': return 'プレミアムプラン';
			case 'payment.description': return 'プレミアムでより多くの機能を開放しよう';
			case 'forceUpdate.title': return '更新のお知らせ';
			case 'forceUpdate.desc': return '新しいバージョンのアプリが利用可能です。ストアより更新ください';
			case 'forceUpdate.label': return '今すぐ更新';
			default: return null;
		}
	}
}

