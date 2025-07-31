import 'package:cloud_firestore/cloud_firestore.dart';

extension QueryEx<T extends Object> on Query<T> {
  Future<List<T>> getData() async {
    final snaps = await get();
    return snaps.docs.map((e) => e.data()).toList();
  }
}

extension DocEx<T extends Object> on DocumentReference<T> {
  Future<T?> getData() async {
    final snaps = await get();
    return snaps.data();
  }
}
