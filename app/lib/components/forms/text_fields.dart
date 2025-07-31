import 'package:flutter/material.dart';

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    this.controller,
    this.helperText,
    this.labelText,
    this.hintText,
    this.validator,
    this.enable,
    this.maxLines,
  });

  final TextEditingController? controller;
  final String? helperText;
  final String? labelText;
  final String? hintText;
  final String? Function(String?)? validator;
  final bool? enable;
  final int? maxLines;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        floatingLabelBehavior: FloatingLabelBehavior.always,
        helperText: helperText ?? "",
        labelText: labelText,
        hintText: hintText,
      ),
      validator: validator,
      enabled: enable,
      maxLines: maxLines,
    );
  }
}
