"use strict";

var dashGrid = function (el) {
    this.grid = $(el);
    this.cols = 4;
    this.rows = parseFloat(Math.ceil(this.gridItem().length / this.cols));
    this.nodes = {};
    this.item = {
        width: (100 / this.cols),
        height: 200
    };

    this.hintNodes();
    this.mapItems();
};

dashGrid.prototype.hintNodes = function (row) {
    var last = (typeof row !== "undefined") ? row : this.rows;

    for (var r = 0; r < (last + 1); r++) {
        for (var c = 0; c < this.cols; c++) {
            var top = this.item.height * r;
            var left = this.item.width * c;

            this.nodes[r + "," + c ] = {"top": top + "px", "left": left + "%", "width": this.item.width + "%", "height": this.item.height + "px"}
        }
    }

    this.rows = last;
    this.gridHeight();

    return this.nodes;
};

dashGrid.prototype.gridItem = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-item" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.gridHint = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-hint" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.gridHeight = function () {
    this.grid.css({"position": "relative", "height": (this.item.height * (this.rows + 1)) + "px"});
};

dashGrid.prototype.mapItems = function () {
    var self = this;
    var exist = [], start_row = 0, start_col = 0;

    this.gridItem().each(function (i, e) {
        var data = self.getData(e);

        if (typeof data.row === "undefined" || typeof data.col === "undefined") {
            exist.push(data.id);
        } else {
            self.gridItem("[data-id='" + data.id + "']").css(self.nodes[data.row + "," + data.col]);
            start_row = data.row;
            start_col = data.col;
        }
    });

    var i = 0;

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            if (typeof exist[i] !== "undefined") {
                if (typeof this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").get(0) === "undefined") {
                    this.gridItem("[data-id='" + exist[i] + "']").attr("data-row", r).attr("data-col", c).css(this.nodes[r + "," + c ]);
                    i++;
                }
            }
        }
    }

    this.grid.append('<div class="dash-grid-hint"></div>');
};

dashGrid.prototype.getData = function (el) {
    var data = {};

    if (typeof el !== "undefined") {
        data = $(el).data();
    }

    return data;
};

dashGrid.prototype.getStyles = function (el) {
    var css = {};

    if (typeof el !== "undefined") {
        $.each($(el).attr("style").split(";"), function (key, value) {
            if (value.trim() != "") {
                var p = value.trim().split(":")[0].trim();
                var v = value.trim().split(":")[1].trim();

                css[p] = v;
            }
        });
    }

    return css;
};

dashGrid.prototype.getAttributes = function (el) {
    var attr = {};

    if (typeof el !== "undefined") {
        $.each($(el)[0].attributes, function (index, attribute) {
            attr[attribute.name] = attribute.value;
        });
    }

    return attr;
}

dashGrid.prototype.draggable = function () {
    var self = this;

    this.grid.kendoDraggable({
        filter: ".dash-grid-item",
        hint: function (element) {
            var w = $(element).width();
            var h = $(element).height();

            return element.clone().addClass("drag").css({"width": w, "height": h});
        },
        drag: function (e) {
            var drag = $(".dash-grid-item.drag").get(0);
            var dragData = self.getData(drag);
            var dragStyles = self.getStyles(drag);
            var dragY = (parseFloat(dragStyles.top) - self.grid.offset().top) + e.offsetY;
            var dragX = (parseFloat(dragStyles.left) - self.grid.offset().left) + e.offsetX;
            var dragTop = parseFloat(dragY);
            var dragLeft = parseFloat((dragX / self.grid.width()) * 100);
            var dragMode = (typeof dragData["mode"] !== "undefined") ? dragData["mode"] : "min";

            $.each(self.nodes, function (key, node) {
                if ((parseFloat(dragTop) >= parseFloat(node.top) && parseFloat(dragTop) <= (parseFloat(node.top) + parseFloat(node.height)))) {
                    if ((parseFloat(dragLeft) >= parseFloat(node.left) && parseFloat(dragLeft) <= (parseFloat(node.left) + parseFloat(node.width)))) {
                        var r = parseFloat(key.split(",")[0]);
                        var c = parseFloat(key.split(",")[1]);

                        if (dragMode == "max") {
                            node.width = (self.item.width * 2) + "%";
                            node.height = (self.item.height * 2) + "px";
                        } else {
                            node.width = (self.item.width * 1) + "%";
                            node.height = (self.item.height * 1) + "px";
                        }

                        self.gridHint().attr("data-row", r).attr("data-col", c).css(node);
                    }
                }
            });
        },
        dragend: function (e) {
            var hint = self.gridHint().get(0);
            var hintAttr = self.getAttributes(hint);
            var hintStyles = self.getStyles(hint);
            var hintRow = parseFloat(hintAttr["data-row"]);
            var hintCol = parseFloat(hintAttr["data-col"]);
            var hintMode = hintAttr["data-mode"];

            var drag = e.currentTarget.get(0);
            var dragAttr = self.getAttributes(drag);
            var dragStyles = self.getStyles(drag);
            var dragRow = parseFloat(dragAttr["data-row"]);
            var dragCol = parseFloat(dragAttr["data-col"]);
            var dragMode = dragAttr["data-mode"];

            var drop = self.gridItem("[data-row='" + hintRow + "'][data-col='" + hintCol + "']").get(0);
            var dropAttr = self.getAttributes(drop);
            var dropStyles = self.getStyles(drop);
            var dropRow = parseFloat(dropAttr["data-row"]);
            var dropCol = parseFloat(dropAttr["data-col"]);
            var dropMode = dropAttr["data-mode"];

            if (dragMode == "max" && hintCol >= (self.cols - 1)) {
                self.gridHint().removeAttr("style");
                return false;
            }

            $(drag).attr("data-row", hintRow).attr("data-col", hintCol).css(hintStyles);

            if (typeof drop !== "undefined") {
                if (dragMode == dropMode) {
                    $(drop).attr("data-row", dragRow).attr("data-col", dragCol).css(dragStyles);
                }
            } else {
                if (dragMode !== "max") {
                    self.clearStack(drag);
                    self.gridHint().removeAttr("style");
                }

                if (dragMode === "max" && dragCol > hintCol) {
                    self.clearStack(drag);
                    self.gridHint().removeAttr("style");
                }
            }

            if (hintRow === self.rows) {
                self.hintNodes(hintRow + 1);
            }

            self.collision(drag);
            self.gridHint().removeAttr("style");

            $(".dash-grid-item.drag").hide();
        }
    });

    this.grid.on("click", ".resize", function (e) {
        var el = $(e.currentTarget).parent().get(0);

        self.resizable(el);
    });
};

dashGrid.prototype.resizable = function (el) {
    var self = this;
    var style = this.getStyles(el);
    var attr = this.getAttributes(el);
    var mode = (typeof attr["data-mode"] !== "undefined") ? attr["data-mode"] : "min";

    if (mode == "min") {
        mode = "max";
        style.width = (parseFloat(style.width) * 2) + "%";
        style.height = (parseFloat(style.height) * 2) + "px";

        if (parseFloat(attr["data-col"]) == (this.cols - 1)) {
            $(el).attr("data-col", (this.cols - 2));
            $(el).attr("data-x-col", (this.cols - 1));

            style.left = this.item.width * (this.cols - 2) + "%";
        }
    } else {
        mode = "min";
        style.width = (parseFloat(style.width) / 2) + "%";
        style.height = (parseFloat(style.height) / 2) + "px";

        if (typeof attr["data-x-col"] !== "undefined") {
            $(el).attr("data-col", $(el).attr("data-x-col"));
            $(el).removeAttr("data-x-col");

            style.left = this.item.width * (this.cols - 1) + "%";
        }
    }

    $(el).attr("data-mode", mode).css(style);

    if (mode == "min") {
        this.gridItem().each(function (i, e) {
            var x = $(e).attr("data-x-row");
            var s = self.getStyles(e);

            if (typeof x !== "undefined") {
                s.top = self.item.height * x;

                $(e).attr("data-row", x).css(s);
                $(e).removeAttr("data-x-row");
            }
        });
    } else {
        this.gridItem().each(function (i, e) {
            $(e).removeAttr("data-x-row");
        });
    }

    this.collision(el);
};

dashGrid.prototype.collision = function (el) {
    var self = this;
    var main = this.getAttributes(el);
    var mainStyles = this.getStyles(el);
    var mainMode = (typeof main["data-mode"] !== "undefined") ? main["data-mode"] : "min";

    var ee = [];

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").each(function (i, e) {
                var other = self.getAttributes(e);
                var otherStyles = self.getStyles(e);

                if (other["data-id"] != main["data-id"]) {
                    if ((parseFloat(otherStyles.top) >= parseFloat(mainStyles.top) && parseFloat(otherStyles.top) < (parseFloat(mainStyles.top) + parseFloat(mainStyles.height)))) {
                        if ((parseFloat(otherStyles.left) >= parseFloat(mainStyles.left) && parseFloat(otherStyles.left) < (parseFloat(mainStyles.left) + parseFloat(mainStyles.width)))) {
                            var row = parseFloat(other["data-row"]) + 1;

                            if (mainMode == "max" && parseFloat(other["data-row"]) == parseFloat(main["data-row"])) {
                                row = parseFloat(other["data-row"]) + 2;
                            }

                            otherStyles.top = self.item.height * row;

                            if (typeof other["data-x-row"] !== "undefined") {
                                $(e).attr("data-row", row).css(otherStyles);
                            } else {
                                $(e).attr("data-row", row).attr("data-x-row", parseFloat(other["data-row"])).css(otherStyles);
                            }

                            ee.push($(e));

                            if (row === self.rows) {
                                self.hintNodes(row + 1);
                            }
                        }
                    }
                }
            });
        }
    }

    $(ee).each(function (i, e) {
        self.collision(e);
    });
};

dashGrid.prototype.clearStack = function (el) {
    var self = this;
    var main = this.getAttributes(el);
    var mainStyles = this.getStyles(el);
    var mainMode = (typeof main["data-mode"] !== "undefined") ? main["data-mode"] : "min";

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").each(function (i, e) {
                var other = self.getAttributes(e);
                var otherStyles = self.getStyles(e);
                var otherMode = (typeof other["data-mode"] !== "undefined") ? other["data-mode"] : "min";

                if (otherMode == "max") {
                    if ((parseFloat(mainStyles.top) >= parseFloat(otherStyles.top) && parseFloat(mainStyles.top) < (parseFloat(otherStyles.top) + parseFloat(otherStyles.height)))) {
                        if ((parseFloat(mainStyles.left) >= parseFloat(otherStyles.left) && parseFloat(mainStyles.left) < (parseFloat(otherStyles.left) + parseFloat(otherStyles.width)))) {
                            var row = parseFloat(main["data-row"]) + 1;

                            if (mainMode == "max" || parseFloat(main["data-row"]) == parseFloat(other["data-row"])) {
                                row = parseFloat(main["data-row"]) + 2;
                            }

                            mainStyles.top = self.item.height * row;

                            $(el).attr("data-row", row).css(mainStyles);

                            self.collision(el);
                        }
                    }
                }
            });
        }
    }
};
