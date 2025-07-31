import 'package:flutter/material.dart';

class LoginButton extends StatelessWidget {
  const LoginButton({
    super.key,
    required this.isLoading,
    required this.icon,
    required this.label,
    this.onPressed,
  });

  final bool isLoading;
  final IconData icon;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: isLoading ? null : onPressed,
      icon: Icon(icon),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        iconSize: 28,
        textStyle: TextStyle(fontSize: 18),
        padding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      ),
    );
  }
}
